export async function fetchAllDataToday() {
  try {
    const response = await fetch("http://localhost:3000/api/fetch-all", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
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
