import { Weekday } from "../../models/Weekday"
import * as FullWeekdayHelpers from "../../models/helpers/FullWeekday"

describe("FullWeekday", () => {
  it("Array has correct order", () => {
    const fullWeekdays = FullWeekdayHelpers.array()
    expect(fullWeekdays[0].weekday).toEqual(Weekday.Monday)
    expect(fullWeekdays[1].weekday).toEqual(Weekday.Tuesday)
    expect(fullWeekdays[2].weekday).toEqual(Weekday.Wednesday)
    expect(fullWeekdays[3].weekday).toEqual(Weekday.Thursday)
    expect(fullWeekdays[4].weekday).toEqual(Weekday.Friday)
    expect(fullWeekdays[5].weekday).toEqual(Weekday.Saturday)
    expect(fullWeekdays[6].weekday).toEqual(Weekday.Sunday)
  })
})
