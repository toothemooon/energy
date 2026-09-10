import { StyleSheet, Text, View } from "react-native";
import ImagePickerExample from "../components/ImagePicker";
export default function HomeScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>hi</Text>
      <ImagePickerExample></ImagePickerExample>
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
