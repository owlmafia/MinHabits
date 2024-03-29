import React from "react"
import { StyleSheet, View, Image } from "react-native"

export const defaultRowHeight = 70
export const defaultSideMargins = 30

export const habitRowTopBottomMargin = 10

export const dividersGrey = "#ccc"
export const dividersHeight = 0.5
export const validationRed = "#f00"

// export const defaultBackgroundColor = "#aaa"
// export const defaultBackgroundColor = "#333"
// export const defaultBackgroundColor = "#003152"
// export const defaultBackgroundColor = "#000"
export const defaultBackgroundColor = "#ddd"
// export const defaultBackgroundColor = "#ADD8E6"
export const defaultRowBackgroundColor = "#fff"

// export const selectedHabitBackgroundColor = "#333"
// export const selectedHabitBackgroundColor = "#aaa"
// export const selectedHabitBackgroundColor = "#003152"
// export const selectedHabitBackgroundColor = "#ADD8E6"
// export const selectedHabitBackgroundColor = "#fff"
export const selectedHabitBackgroundColor = "#ddd"
export const selectedHabitTextColor = "#000"

const sharedStyles = StyleSheet.create({
  boxed: {
    paddingLeft: defaultSideMargins,
    paddingRight: defaultSideMargins,
    borderRadius: 6,
    backgroundColor: defaultRowBackgroundColor,
  },
  button: {
    width: 200,
    paddingTop: 10,
    paddingBottom: 10,
    alignSelf: "center",
    borderRadius: 6,
  },
  plainRow: {
    flex: 1,
    // display: "flex",
    flexDirection: "row",
    backgroundColor: defaultRowBackgroundColor,
    paddingLeft: defaultSideMargins,
    paddingRight: defaultSideMargins,
    height: defaultRowHeight,
  }
})

export const globalStyles = StyleSheet.create({
  habit: {
    fontSize: 18,
    // height: 20,
    alignSelf: "center",
  },
  navigationBar: {
    borderBottomColor: "black",
    borderBottomWidth: 0.5,
  },
  // habitRow: {
  //   ...sharedStyles.boxed,
  //   flex: 1,
  //   display: "flex",
  //   backgroundColor: defaultRowBackgroundColor,
  //   flexDirection: "row",
  //   marginLeft: 20,
  //   marginTop: habitRowTopBottomMargin,
  //   marginBottom: habitRowTopBottomMargin,
  //   borderRadius: 6,
  //   marginRight: 20,
  //   paddingLeft: defaultSideMargins,
  //   paddingRight: defaultSideMargins,
  //   alignItems: "center",
  //   height: defaultRowHeight,
  // },
  habitRow: {
    ...sharedStyles.plainRow
  },
  manageHabitsRow: {
    ...sharedStyles.plainRow
  },
  flatRow: {
    ...sharedStyles.plainRow
  },
  navBarTitleText: {
    fontSize: 17,
    letterSpacing: 0.5,
    color: "#333",
    fontWeight: "500",
  },
  submitButton: {
    ...sharedStyles.button,
    backgroundColor: "black",
  },
  deleteButton: {
    ...sharedStyles.button,
    backgroundColor: "red",
  },
  submitButtonText: {
    fontSize: 18,
    color: "white",
    alignSelf: "center",
  },
})

export const listSeparator = () => {
  return (
    <View
      style={{
        height: dividersHeight,
        // width: "86%",
        backgroundColor: dividersGrey,
        // marginLeft: Dimensions.defaultSideMargins,
        // marginRight: Dimensions.defaultSideMargins
      }}
    />
  )
}

export const closeModalImage = () => {
  return (
    <Image style={{ width: 30, height: 30, marginTop: 10, marginRight: 15 }} source={require("../assets/close.png")} />
  )
}
