import React, { Component } from "react"

import { Text, View, ScrollView } from "react-native"
import { Habit } from "../models/Habit"
import NavigationBar from "react-native-navbar"
import { ApplicationState } from "../redux/reducers/RootReducer"
import { connect } from "react-redux"
import { WholePercentage } from "../models/helpers/WholePercentage"
import * as WholePercentageHelpers from "../models/helpers/WholePercentage"
import { MonthPercentage } from "../models/helpers/MonthPercentage"
import { fetchAllStatsAction, StatsThunkDispatch } from "../redux/reducers/ui/StatsReducer"
import { VictoryBar, VictoryChart } from "victory-native"
import * as MonthHelpers from "../models/Month"
import * as DateUtils from "../utils/DateUtils"

interface PropsFromState {
  totalDonePercentage?: WholePercentage
  monthDonePercentages: MonthPercentage[]
  needAttentionHabits: Habit[]
}

interface PropsFromDispatch {
  fetchAllStats: typeof fetchAllStatsAction
}

interface OwnProps {}

type AllProps = PropsFromState & PropsFromDispatch & OwnProps

export interface StatsViewState {}

class StatsView extends Component<AllProps, StatsViewState> {
  componentWillMount() {
    this.props.fetchAllStats()
  }

  private formatTotalDonePercentage(totalDonePercentage: WholePercentage | undefined): string {
    if (totalDonePercentage === undefined) {
      return "-"
    }
    return WholePercentageHelpers.toString(totalDonePercentage) + "%"
  }

  private needAttentionHabitsString(habits: Habit[]): string {
    return habits.reduce((rv, habit) => rv + (rv.length == 0 ? "" : ", ") + habit.name, "")
  }

  render() {
    return (
      <View>
        <NavigationBar title={<Text>{"Stats"}</Text>} />
        <ScrollView>
          <View>
            <Text>{this.formatTotalDonePercentage(this.props.totalDonePercentage)}</Text>
          </View>
          <View>
            <VictoryChart domainPadding={25}>
              <VictoryBar
                categories={{
                  x: MonthHelpers.array().map(month => DateUtils.monthShortName(month)),
                  y: []
                }}
                data={this.props.monthDonePercentages.map(monthPercentage => {
                  return {
                    x: DateUtils.monthShortName(monthPercentage.month),
                    y: WholePercentageHelpers.toNumber(monthPercentage.percentage)
                  }
                })}
              />
            </VictoryChart>
          </View>
          <View>
            <Text>{"Need attention: " + this.needAttentionHabitsString(this.props.needAttentionHabits)}</Text>
          </View>
        </ScrollView>
      </View>
    )
  }
}

const mapStateToProps = ({ ui: { stats } }: ApplicationState) => ({
  totalDonePercentage: stats.totalDonePercentage,
  monthDonePercentages: stats.monthDonePercentages,
  needAttentionHabits: stats.needAttentionHabits
})
const mapDispatchToProps = (dispatch: StatsThunkDispatch) => ({
  fetchAllStats: () => dispatch(fetchAllStatsAction())
})

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(StatsView)