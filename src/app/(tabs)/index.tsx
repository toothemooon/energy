import Button from "@/app/components/Button";
import { testConnection } from "@/services/api";
import { StyleSheet, Text, View } from "react-native";
import ImagePickerExample from "../components/ImagePicker";
export default function HomeScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>hi</Text>
      <ImagePickerExample></ImagePickerExample>
      <Button onPress={testConnection} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#25292e",
    justifyContent: "center",
    alignItems: "center",
  },
  text: {
    color: "#fff",
  },
});
