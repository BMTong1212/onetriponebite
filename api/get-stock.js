/**
 * Serverless function to fetch inventory stock levels from a Notion database.
 * This runs on Netlify (Node.js 18+ supported natively).
 */
exports.handler = async (event, context) => {
  const token = process.env.NOTION_INTEGRATION_TOKEN;
  const databaseId = process.env.NOTION_DATABASE_ID;

  // Return a mock payload if variables are not configured yet,
  // to allow testing the UI without crashing the site.
  if (!token || !databaseId) {
    console.warn("NOTION_INTEGRATION_TOKEN or NOTION_DATABASE_ID is missing. Returning mock data.");
    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "public, max-age=10" // short cache for mock data
      },
      body: JSON.stringify({
        "glow_8": 15,
        "glow_50": 0, // Mock: Out of Stock
        "limbo_slice_8": 20,
        "limbo_slice_50": 0, // Mock: Out of Stock
        "jig_goldeneye_1_4_5": 0, // Mock: Out of Stock
        "jig_goldeneye_1_4_50": 10,
        "jig_black_platinum_3_8_50": 0 // Mock: Out of Stock
      })
    };
  }

  try {
    const response = await fetch(`https://api.notion.com/v1/databases/${databaseId}/query`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Notion-Version": "2022-06-28",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        page_size: 100 // fetch up to 100 items
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      return {
        statusCode: response.status,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ error: `Notion API responded with error: ${errText}` })
      };
    }

    const data = await response.json();
    const stockMap = {};

    for (const page of data.results) {
      const props = page.properties;
      if (!props) continue;

      // Identify the SKU (Title field)
      const skuProp = props["SKU"] || props["Key"] || props["Name"];
      // Identify the Stock (Number field)
      const stockProp = props["Stock"] || props["Quantity"];

      if (skuProp && skuProp.title && skuProp.title.length > 0) {
        const sku = skuProp.title[0].plain_text.trim();
        
        let stockVal = 999; // Default to in-stock if column is missing
        if (stockProp) {
          if (stockProp.type === "number") {
            stockVal = stockProp.number !== null ? stockProp.number : 0;
          } else if (stockProp.type === "checkbox") {
            // If it's a checkbox and it's named 'Out of Stock', true = 0 stock
            stockVal = stockProp.checkbox ? 0 : 999;
          }
        }
        stockMap[sku] = stockVal;
      }
    }

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "public, max-age=60" // Cache responses for 60 seconds
      },
      body: JSON.stringify(stockMap)
    };
  } catch (error) {
    console.error("Error fetching Notion stock:", error);
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ error: error.message })
    };
  }
};
