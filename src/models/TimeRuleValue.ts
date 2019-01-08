import { DayDate } from "./DayDate"
import { TimeUnit } from "./TimeUnit"

export interface DateTimeRuleValue {
  kind: "date"
  value: DayDate
}

// TODO should we use more specific tagged types like WeeklyTimeRuleValue (etc), such that we also can validate?
// Currently it's possible to have a TimeRule with Weekly type and a value (which is of type PlainTimeRuleValue) with
// a number > 6. The validation can be done "externally" with current types but this seems cumbersome, so not doing it.
export type TimeRuleValue = PlainTimeRuleValue | NumberListTimeRuleValue | UnitTimeRuleValue

// TODO (2): specific date time rule value? schedule e.g. for "the 4th July each year", or "the 12th each month", 
// "the 12th each 2 months" or a specific complete date

export interface PlainTimeRuleValue {
  kind: "plain"
  value: number
}

export interface NumberListTimeRuleValue {
  kind: "numberList"
  numbers: number[]
}

export interface UnitTimeRuleValue {
  kind: "unit"
  value: number
  unit: TimeUnit
}

// TODO can we just use TimeRuleValue instead and remove this?
export enum TimeRuleValueDescriptor {
  Plain,
  NumberList,
  Unit
}

export interface UnitTimeRuleValueJSON {
  value: number,
  unit: string
}

export namespace TimeRuleValue {
  export function parse(type: TimeRuleValueDescriptor, json: number | number[] | UnitTimeRuleValueJSON): TimeRuleValue {
    switch (type) {
      case TimeRuleValueDescriptor.Plain:
        if (typeof json !== "number") {
          throw new Error(`Invalid type: ${json}`)
        }
        return createPlainTimeRuleValue(json)
      case TimeRuleValueDescriptor.NumberList:
      if (!isArrayOfNumber(json)) {
        throw new Error(`Invalid type: ${json}`)
      } 
        return parseNumberArrayTimeRuleValue(json)
      case TimeRuleValueDescriptor.Unit:
        if (!isUnitTimeRuleValueJSON(json)) {
          throw new Error(`Invalid type: ${json}`)
        }
        return parseUnitTimeRuleValue(json)
    }
  }

  function createPlainTimeRuleValue(json: number): PlainTimeRuleValue {
    if (json < 1) {
      throw new Error(`Value: ${json} must be > 1`) // It doesn't make sense to schedule 0 or less times.
    }

    return { kind: "plain", value: json }
  }

  function parseNumberArrayTimeRuleValue(json: number[]): NumberListTimeRuleValue {
    if (json.length == 0 ) {
      throw new Error("Array must not be empty") // It doesn't make sense to not schedule
    }
    return {
      kind: "numberList",
      numbers: json
    }
  }

  function parseUnitTimeRuleValue(json: UnitTimeRuleValueJSON): UnitTimeRuleValue {
    if (json.value < 1) {
      throw new Error(`Value: ${json.value} must be > 1`) // It doesn't make sense to schedule 0 or less times.
    }

    return {
      kind: "unit",
      value: json.value,
      unit: TimeUnit.parse(json.unit)
    }
  }

  export function toJSON(value: TimeRuleValue): number | number[] | UnitTimeRuleValueJSON {
    switch (value.kind) {
      case "plain":
        return value.value
      case "numberList":
        return value.numbers
      case "unit":
        return { value: value.value, unit: TimeUnit.toJSON(value.unit) }
    }
  }

  function isUnitTimeRuleValueJSON(json: number | number[] | UnitTimeRuleValueJSON): json is UnitTimeRuleValueJSON {
    return (<UnitTimeRuleValueJSON>json).unit !== undefined;
  }

  function isArrayOfNumber(json: number | number[] | UnitTimeRuleValueJSON): json is number[] {
    return Array.isArray(json)
  }
}
