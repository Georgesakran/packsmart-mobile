import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import TemplatesScreen from "../screens/templates/TemplatesScreen";
import CreateTemplateScreen from "../screens/templates/CreateTemplateScreen";
import EditTemplateScreen from "../screens/templates/EditTemplateScreen";

const Stack = createNativeStackNavigator();

export default function TemplatesStackNavigator() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="TemplatesHome"
        component={TemplatesScreen}
        options={{ title: "Templates" }}
      />
      <Stack.Screen
        name="CreateTemplate"
        component={CreateTemplateScreen}
        options={{ title: "Create Template" }}
      />
      <Stack.Screen
        name="EditTemplate"
        component={EditTemplateScreen}
        options={{ title: "Edit Template" }}
      />
    </Stack.Navigator>
  );
}