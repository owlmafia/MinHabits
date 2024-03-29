import { SQLite, HashMap } from "expo"
import { Habit } from "./models/Habit"
import * as TimeRuleHelpers from "./models/TimeRule"
import * as DayDateHelpers from "./models/DayDate"
import { DayDate } from "./models/DayDate"
import { EditHabitInputs } from "./models/helpers/EditHabitInputs"
import { ResolvedTask } from "./models/ResolvedTask"
import PrefillRepo from "./PrefillRepo"
import { ResolvedTaskWithHabit } from "./models/join/ResolvedTaskWithHabit"
import { ResolvedTaskInput } from "./models/helpers/ResolvedTaskInput"
import { WaitingNeedAttentionHabit } from "./models/WaitingNeedAttentionHabit"
import { resolvedTasksWithManyFailed } from "./__tests_deps/ExampleTasks"
import { MemoVoidDictionaryIterator } from "lodash"

const db = SQLite.openDatabase("db.db")

export type ResolvedTaskUnique = {
  habitId: number
  date: DayDate
}

// TODO cascade delete (habit -> resolved tasks and habit -> habits_attention_waiting)

export default class Repo {
  static init = () => {
    return new Promise((resolve, reject) => {
      console.log("Initializing db")
      return db.transaction((tx: SQLite.Transaction) => {
        tx.executeSql(
          "create table if not exists habits (id integer primary key not null, name text unique, time text, ord integer);",
          [],
          () => {
            console.log("Create habits if not exist success")
          },
          ({}, error) => {
            console.log(`Create table error: ${error}`)
          }
        )
        tx.executeSql(
          "create table if not exists resolved_tasks (id integer primary key not null, habitId integer, done integer, date text, " +
            "foreign key(habitId) references habits(id), " +
            "unique (habitId, date) on conflict replace" +
            ");",
          [],
          () => {
            console.log("Create resolved_tasks if not exist success")
          },
          ({}, error) => {
            console.log(`Create table error: ${error}`)
          }
        )
        tx.executeSql(
          "create table if not exists habits_attention_waiting (habitId integer primary key not null, date text);",
          [],
          () => {
            console.log("Create habits_attention_waiting if not exist success")
          },
          ({}, error) => {
            console.log(`Create table error: ${error}`)
          }
        )
        tx.executeSql(
          "create index if not exists tasks_date_index ON resolved_tasks (date);",
          [],
          () => {
            console.log("Create tasks_date_index success")
          },
          ({}, error) => {
            console.log(`Create index error: ${error}`)
          }
        )
        
        // PrefillRepo.prefill(tx)

        resolve()
      })
    })
  }

  static loadHabits: () => Promise<Habit[]> = async () => {
    return new Promise((resolve, reject) =>
      db.transaction((tx: SQLite.Transaction) => {
        tx.executeSql(
          `select * from habits`,
          [],
          (_, { rows: { _array } }) => {
            // console.log(`Loaded habits from db: ${JSON.stringify(_array)}`)
            const unsortedHabits = _array.map((map: HashMap) => Repo.toHabit(map))
            const sortedHabits = unsortedHabits.sort((a, b) => a.order - b.order)
            resolve(sortedHabits)
          },
          ({}, error) => {
            console.log(`Loading error: ${error}`)
            reject()
          }
        )
      })
    )
  }

  static loadHabitsAttentionWaiting: () => Promise<WaitingNeedAttentionHabit[]> = async () => {
    return new Promise((resolve, reject) =>
      db.transaction((tx: SQLite.Transaction) => {
        tx.executeSql(
          `select * from habits_attention_waiting`,
          [],
          (_, { rows: { _array } }) => {
            resolve(
              _array.map((map: HashMap) => {
                const habitId: number = map["habitId"]
                const dateString: string = map["date"]
                return {
                  habitId: habitId,
                  date: DayDateHelpers.parse(dateString),
                }
              })
            )
          },
          ({}, error) => {
            console.log(`Loading error: ${error}`)
            reject()
          }
        )
      })
    )
  }

  static addHabitAttentionWaiting = async (habit: WaitingNeedAttentionHabit) => {
    return new Promise((resolve, reject) =>
      db.transaction((tx: SQLite.Transaction) => {
        Repo.addHabitAttentionWaitingInTransaction(habit, tx, () => resolve(), () => reject())
      })
    )
  }

  private static addHabitAttentionWaitingInTransaction = (
    habit: WaitingNeedAttentionHabit,
    tx: SQLite.Transaction,
    resolve: () => void,
    reject: () => void
  ) => {
    tx.executeSql(
      `insert or replace into habits_attention_waiting (habitId, date) values (?, ?)`,
      [habit.habitId.toString(), DayDateHelpers.toJSON(habit.date)],
      () => {
        console.log(`Added habit id attention waiting: ${habit.habitId}`)
        resolve()
      },
      ({}, error) => {
        console.log(`Add habit id attention waiting error: ${error}`)
        reject()
      }
    )
  }

  static overwriteHabitsAttentionWaiting = async (habits: WaitingNeedAttentionHabit[]) => {
    return new Promise((resolve, reject) =>
      db.transaction((tx: SQLite.Transaction) => {
        // Delete all entries
        tx.executeSql(
          `delete from habits_attention_waiting`,
          [],
          () => {
            console.log(`Deleted all entries from habits_attention_waiting`)
            resolve()
          },
          ({}, error) => {
            console.log(`Deleting all entries from habits_attention_waiting error: ${error}`)
            reject()
          }
        )

        // Add new entries
        for (const habit of habits) {
          Repo.addHabitAttentionWaitingInTransaction(habit, tx, () => resolve(), () => reject())
        }
      })
    )
  }

  // TODO test (manual)
  static deleteHabits = async (ids: number[]) => {
    return new Promise((resolve, reject) =>
      db.transaction((tx: SQLite.Transaction) => {
        tx.executeSql(
          `delete from habits where (id) in (?)`,
          ids,
          () => {
            console.log(`Deleted habits with ids: ${ids}`)
            resolve()
          },
          ({}, error) => {
            console.log(`Deleting habits error: ${error}`)
            reject()
          }
        )
      })
    )
  }

  private static generateDateQuery: (dateFilter: ResolvedTaskDateFilter) => [string, string[]] = (
    dateFilter: ResolvedTaskDateFilter
  ) => {
    switch (dateFilter.kind) {
      case "match":
        return [` where date=?`, [DayDateHelpers.toJSON(dateFilter.date)]]
      case "before":
        return [` where date<?`, [DayDateHelpers.toJSON(dateFilter.date)]]
      case "between":
        return [
          ` where date>=? and date<=?`,
          [DayDateHelpers.toJSON(dateFilter.startDate), DayDateHelpers.toJSON(dateFilter.endDate)],
        ]
      case "none":
        return [``, []]
    }
  }

  static loadResolvedTasks: (dateFilter: ResolvedTaskDateFilter) => Promise<ResolvedTask[]> = async (
    dateFilter: ResolvedTaskDateFilter
  ) => {
    const [dateQuery, dateQueryFilters] = Repo.generateDateQuery(dateFilter)

    return new Promise((resolve, reject) =>
      db.transaction((tx: SQLite.Transaction) => {
        const selectAll = `select * from resolved_tasks`
        tx.executeSql(
          selectAll + dateQuery,
          dateQueryFilters,
          (_, { rows: { _array } }) => {
            resolve(_array.map((map: HashMap) => Repo.toResolvedTask(map)))
          },
          ({}, error) => {
            console.log(`Loading error: ${error}`)
            reject()
          }
        )
      })
    )
  }

  static upsertResolvedTask = async (input: ResolvedTaskInput) => {
    return new Promise((resolve, reject) =>
      db.transaction((tx: SQLite.Transaction) => {
        tx.executeSql(
          // `insert or replace into resolved_tasks (habitId, done, date) values (?, ?, ?)`,
          `insert into resolved_tasks (habitId, done, date) values (?, ?, ?)`,
          [input.habitId.toString(), input.done ? "1" : "0", DayDateHelpers.toJSON(input.date)],
          () => {
            resolve()
          },
          ({}, error) => {
            console.log(`Add habit error: ${error}`)
            reject()
          }
        )
      })
    )
  }

  static removeResolvedTask = async (unique: ResolvedTaskUnique) => {
    return new Promise((resolve, reject) =>
      db.transaction((tx: SQLite.Transaction) => {
        tx.executeSql(
          `delete from resolved_tasks where habitId=? and date=?`,
          [unique.habitId.toString(), DayDateHelpers.toJSON(unique.date)],
          () => {
            resolve()
          },
          ({}, error) => {
            console.log(`Add habit error: ${error}`)
            reject()
          }
        )
      })
    )
  }

  static loadResolvedTasksWithHabits: (dateFilter: ResolvedTaskDateFilter) => Promise<ResolvedTaskWithHabit[]> = async (
    dateFilter: ResolvedTaskDateFilter
  ) => {
    const [dateQuery, dateQueryFilters] = Repo.generateDateQuery(dateFilter)

    return new Promise((resolve, reject) =>
      db.transaction((tx: SQLite.Transaction) => {
        const selectAll = `select *, resolved_tasks.id as taskId from resolved_tasks join habits on resolved_tasks.habitId = habits.id`
        tx.executeSql(
          selectAll + dateQuery,
          dateQueryFilters,
          (_, { rows: { _array } }) => {
            const tasks: ResolvedTaskWithHabit[] = _array.map((map: HashMap) => {
              const taskId: number = map["taskId"]
              const habitId: number = map["habitId"]
              const doneNumber: number = map["done"]
              const dateString: string = map["date"]

              const habitName: string = map["name"]
              const timeString: string = map["time"]
              const habitOrder: number = map["ord"]

              return {
                task: {
                  id: taskId,
                  habitId: habitId,
                  done: doneNumber == 1 ? true : false,
                  date: DayDateHelpers.parse(dateString),
                },
                habit: {
                  id: habitId,
                  name: habitName,
                  time: TimeRuleHelpers.parse(JSON.parse(timeString)),
                  order: habitOrder,
                },
              }
            })
            resolve(tasks)
          },
          ({}, error) => {
            console.log(`Loading error: ${error}`)
            reject()
          }
        )
      })
    )
  }

  static resetProgress = async() => {
    return new Promise((resolve, reject) =>
      db.transaction((tx: SQLite.Transaction) => {
        tx.executeSql(
          `delete from resolved_tasks; delete from habits_attention_waiting`,
          [],
          () => {
            resolve()
          },
          ({}, error) => {
            console.log(`Add habit error: ${error}`)
            reject()
          }
        )
      })
    )
  }
  
  // TODO test this (at least manually, all paths)...
  static determineOrder = async (inputs: EditHabitInputs): Promise<number> => {
    return new Promise((resolve, reject) => {
      db.transaction((tx: SQLite.Transaction) => {
        tx.executeSql(
          `select (ord) from habits where name=${inputs.name}`,
          [],
          (_, { rows: { _array } }) => {
            if (_array.length == 0) { // Habit doesn't exit

              // Retrieve max order
              db.transaction((tx: SQLite.Transaction) => {
                tx.executeSql(
                  `select max(ord) from habits`,
                  [],
                  (_, { rows: { _array } }) => {
                    console.log(">>>> habit doesn't exist. retrieved max order: " + JSON.stringify(_array))
                    resolve(1)
                  },
                  ({}, error) => {
                    console.log(`Loading error: ${error}`)
                    reject()
                  }
                )
              })

            } else {
              // Habit already exists - return order of existing item
              if (_array.length != 1) {
                console.error("Expecting only 1 result: " + JSON.stringify(_array))
              }
              const habit = _array[0]
              const order = habit["ord"]

              console.log(">>> habit exists! it's order is: " + order + ". row: " + JSON.stringify(habit));
              
              resolve(order)
            }
          },
          ({}, error) => {
            console.log(`Loading error: ${error}`)
            reject()
          }
        )
      })
    })
  }

  static upsertHabits = async (inputs: EditHabitInputs[]) => {
    return new Promise((resolve, reject) =>
      db.transaction((tx: SQLite.Transaction) => {
        inputs.forEach(input => Repo.upsertHabitInTransaction(input, tx, resolve, reject))
      })
    )
  }

  static generateQuery = (inputs: EditHabitInputs, pars: string[]): [string, string[]] => {
    var columns = ["name", "time"]
    var finalPars = pars

    if (inputs.id !== undefined) {
      columns.push("id")
      finalPars.push(inputs.id.toString())
    }
    if (inputs.order !== undefined) {
      columns.push("ord")
      finalPars.push(inputs.order.toString())
    }

    const columnsStr = columns.join(", ")
    const placeholdersStr = new Array(columns.length).fill("?").join(", ")
    const query = `insert or replace into habits (${columnsStr}) values (${placeholdersStr})`

    return [query, finalPars]
  }

  static upsertHabitInTransaction = async (
    inputs: EditHabitInputs,
    tx: SQLite.Transaction,
    resolve: () => void,
    reject: () => void
  ) => {
    const pars = [
      inputs.name,
      JSON.stringify(
        TimeRuleHelpers.toJSON({
          value: inputs.timeRuleValue,
          start: inputs.startDate,
        })
      ),
    ]

    if (inputs.order === undefined) {
      // retrieve order
      inputs.order = await Repo.determineOrder(inputs)
    }

    const [query, parameters] = Repo.generateQuery(inputs, pars)
    tx.executeSql(
      query,
      parameters,
      () => {
        resolve()
      },
      ({}, error) => {
        console.log(`Add habit error: ${error}`)
        reject()
      }
    )
  }

  static upsertHabit = async (inputs: EditHabitInputs) => {
    return new Promise((resolve, reject) =>
      db.transaction((tx: SQLite.Transaction) => {
        Repo.upsertHabitInTransaction(inputs, tx, resolve, reject)
      })
    )
  }

  static toResolvedTask(map: HashMap): ResolvedTask {
    const id: number = map["id"]
    const habitId: number = map["habitId"]
    const doneNumber: number = map["done"]
    const dateString: string = map["date"]

    return {
      id: id,
      habitId: habitId,
      done: doneNumber == 1 ? true : false,
      date: DayDateHelpers.parse(dateString),
    }
  }

  static toHabit(map: HashMap): Habit {
    const id: number = map["id"]
    const nameString: string = map["name"]
    const timeString: string = map["time"]
    const order: number = map["ord"]
    return {
      id: id,
      name: nameString,
      time: TimeRuleHelpers.parse(JSON.parse(timeString)),
      order: order,
    }
  }
}

export type ResolvedTaskDateFilter =
  | ResolvedTaskDateFilterBefore
  | ResolvedTaskDateFilterMatch
  | ResolvedTaskDateFilterBetween
  | ResolvedTaskDateFilterNone

export interface ResolvedTaskDateFilterBefore {
  kind: "before"
  date: DayDate
}

export interface ResolvedTaskDateFilterMatch {
  kind: "match"
  date: DayDate
}

export interface ResolvedTaskDateFilterBetween {
  kind: "between"
  startDate: DayDate
  endDate: DayDate
}

export interface ResolvedTaskDateFilterNone {
  kind: "none"
}
