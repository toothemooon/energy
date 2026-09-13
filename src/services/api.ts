export async function testConnection() {
  const response = await fetch("http://localhost:8090/hello/world");
  const data = await response.json();
  console.log(data);
  return data;
}

// 发送请求
export async function analyzeFood(imageDataUrl: string): Promise<number> {
  const response = await fetch("http://localhost:8090/api/analyze-food", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      image: imageDataUrl,
    }),
  });

  console.log(response.status);

  const data = await response.json();

  console.log("eneryKcal is " + data.energyKcal);
  return data.energyKcal;
}
