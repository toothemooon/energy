import { Pressable, StyleSheet, Text, View } from "react-native";

export default function Button() {
  return (
    <View style={styles.container}>
      <Pressable
        style={styles.button}
        onPress={() => console.log("Button pressed!")}
      >
        <Text style={styles.buttonText}>Press Me</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {},
  button: {
    backgroundColor: "#007AFF",
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
  },
});
