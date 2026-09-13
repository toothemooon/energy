import { File } from "expo-file-system";

export async function testConnection() {
  const response = await fetch("http://localhost:8090/hello/world");
  const data = await response.json();
  console.log(data);
  return data;
}

export async function analyzeFood(imageUri: string): Promise<number> {
  const imageFile = new File(imageUri);

  console.log("文件 URI:", imageFile.uri);
  console.log("文件名:", imageFile.name);
  console.log("文件类型:", imageFile.type);
  console.log("文件大小:", imageFile.size);

  const formData = new FormData();

  formData.append("image", imageFile, "food.jpg");

  const response = await fetch("http://localhost:8090/api/analyze-food", {
    method: "POST",
    body: formData,
  });

  const data = await response.json();

  return data.energyKcal;
}
