export async function testConnection() {
  const response = await fetch("http://localhost:8090/hello/world");
  const data = await response.json();
  console.log(data);
  return data;
}

// 发送请求
export type Analysis = {
  totalCalories: number;
  foods: {
    name: string;
    calories: number;
  }[];
  message: string;
};

// 5. await 调用
export async function analyzeFood(imageDataUrl: string): Promise<Analysis> {
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

  const analysis = await response.json();

  console.log(analysis.totalCalories);
  console.log(analysis.foods);
  console.log(analysis.message);

  return analysis;
}
