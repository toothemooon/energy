import { Pressable, StyleSheet, Text, View } from "react-native";

type Props = {
  onPress: () => void; // 这是一个函数类型
};
export default function Button(prop: Props) {
  return (
    <View style={styles.container}>
      <Pressable style={styles.button} onPress={prop.onPress}>
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
