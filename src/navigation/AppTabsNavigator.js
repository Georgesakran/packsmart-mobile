// import React from "react";
// import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
// import HomeScreen from "../screens/home/HomeScreen";
// import ProfileScreen from "../screens/profile/ProfileScreen";
// import TripsStackNavigator from "./TripsStackNavigator";

// const Tab = createBottomTabNavigator();

// export default function AppTabsNavigator() {
//   return (
//     <Tab.Navigator screenOptions={{ headerShown: false }}>
//       <Tab.Screen name="Home" component={HomeScreen} />
//       <Tab.Screen
//         name="Trips"
//         component={TripsStackNavigator}
//         options={{ headerShown: false }}
//       />
//       <Tab.Screen name="Profile" component={ProfileScreen} />
//     </Tab.Navigator>
//   );
// }



import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";

import DashboardStackNavigator from "./DashboardStackNavigator";
import TripFlowStackNavigator from "./TripFlowStackNavigator";
import ProfileStackNavigator from "./ProfileStackNavigator";

const Tab = createBottomTabNavigator();

export default function AppTabsNavigator() {
  return (
    <Tab.Navigator screenOptions={{ headerShown: false }}>
      <Tab.Screen
        name="DashboardTab"
        component={DashboardStackNavigator}
        options={{ title: "Dashboard" }}
      />

      <Tab.Screen
        name="TripsTab"
        component={TripFlowStackNavigator}
        options={{ title: "Trips" }}
      />

      <Tab.Screen
        name="ProfileTab"
        component={ProfileStackNavigator}
        options={{ title: "Profile" }}
      />
    </Tab.Navigator>
  );
}