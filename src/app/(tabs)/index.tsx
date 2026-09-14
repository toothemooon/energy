import Button from "@/app/components/Button";
import { analyzeFood, testConnection, type Analysis } from "@/services/api";
import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import ImagePickerExample from "../components/ImagePicker";

export default function HomeScreen() {
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const handleFetchData = async (imageDataUrl: string) => {
    const result = await analyzeFood(imageDataUrl);
    setAnalysis(result);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.text}>hi</Text>
      <ImagePickerExample onPress={handleFetchData} />
      <Button onPress={testConnection} />
      {analysis && (
        <View>
          <Text style={styles.text}>总热量：{analysis.totalCalories} kcal</Text>
          <Text style={styles.text}>{analysis.message}</Text>
        </View>
      )}
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
