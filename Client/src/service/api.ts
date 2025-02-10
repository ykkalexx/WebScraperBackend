export async function fetchAllDataToday() {
  const todaysDate = new Date().toISOString().split("T")[0];

  try {
    const response = await fetch("http://localhost:3000/api/fetch-today", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ date: todaysDate }),
    });

    if (!response.ok) {
      console.log("Error: Failed to fetch data");
    }

    const data = await response.json();
    return data;
  } catch {
    console.log("Error: Failed to fetch data");
  }
}
