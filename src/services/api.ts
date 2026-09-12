export async function testConnection() {
  const response = await fetch("http://localhost:8090/hello/world");
  const data = await response.json();
  console.log(data);
  return data;
}

export async function analyzeFood(imageUri: string) {
  const formData = new FormData();
  formData.append("image", {
    url: imageUri,
    type: "image/jpeg",
    name: "food.jpg",
  } as any);

  const response = await fetch("http://localhost:8090/api/analyze-food", {
    method: "POST",
    body: formData,
  });

  const data = await response.json();

  return data.energyKcal;
}
