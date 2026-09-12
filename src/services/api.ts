export async function testConnection() {
  const response = await fetch("http://localhost:8090/hello/world");
  const data = await response.json();
  console.log(data);
  return data;
}

export async function analyzeFood(imageUri: string) {
  console.log("=== analyzeFood 开始 ===");
  console.log("imageUri:", imageUri);

  const formData = new FormData();
  formData.append("image", {
    uri: imageUri,
    type: "image/jpeg",
    name: "food.jpg",
  } as any);

  console.log("准备发送请求...");

  try {
    const response = await fetch("http://localhost:8090/api/analyze-food", {
      method: "POST",
      body: formData,
    });

    console.log("收到响应，状态码:", response.status);

    const data = await response.json();
    console.log("响应数据:", data);

    return data.energyKcal;
  } catch (error) {
    console.error("请求失败:", error);
    throw error;
  }
}
