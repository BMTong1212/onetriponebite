/**
 * Helper function to map user's human-readable Notion database titles to website SKU keys.
 * Handles parsing for both Jig Heads and Matrix Shad lures.
 */
function mapNotionTitleToSKU(title) {
  const t = title.toLowerCase().trim();
  
  // 1. Parse Jig Heads (e.g. "Goldeneye Jig Heads — Bullseye Series | 1/2 oz")
  if (t.includes("jig head") || t.includes("jighead") || t.includes("jig")) {
    let series = "";
    if (t.includes("bullseye")) series = "bullseye";
    else if (t.includes("black platinum") || t.includes("platinum")) series = "black_platinum";
    else if (t.includes("goldeneye") || t.includes("golden eye")) series = "goldeneye";
    
    let weight = "";
    if (t.includes("1/16") || t.includes("1_16")) weight = "1_16";
    else if (t.includes("1/8") || t.includes("1_8")) weight = "1_8";
    else if (t.includes("1/4") || t.includes("1_4")) weight = "1_4";
    else if (t.includes("5/16") || t.includes("5_16")) weight = "5_16";
    else if (t.includes("3/8") || t.includes("3_8")) weight = "3_8";
    else if (t.includes("1/2") || t.includes("1_2")) weight = "1_2";
    
    // Check pack size (default to 5 for jigs, if title contains "50" it's 50)
    let pack = "5";
    if (t.includes("50")) pack = "50";
    
    if (series && weight) {
      return `jig_${series}_${weight}_${pack}`;
    }
  }
  
  // 2. Parse Matrix Shad Lures (e.g. "Matrix Shad - Glow" or "Glow")
  const colors = [
    { name: "holy joely", id: "holy_joely" },
    { name: "shrimp creole", id: "shrimp_creole" },
    { name: "limbo slice", id: "limbo_slice" },
    { name: "green hornet", id: "green_hornet" },
    { name: "tiger bait", id: "tiger_bait" },
    { name: "ultra violet", id: "ultra_violet" },
    { name: "ultra-violet", id: "ultra_violet" },
    { name: "pink champagne", id: "pink_champagne" },
    { name: "midnight mullet", id: "midnight_mullet" },
    { name: "lemon head", id: "lemon_head" },
    { name: "glow", id: "glow" },
    { name: "magneto", id: "magneto" },
    { name: "avocado", id: "avocado" }
  ];
  
  for (const c of colors) {
    if (t.includes(c.name)) {
      let pack = "8";
      if (t.includes("50")) pack = "50";
      return `${c.id}_${pack}`;
    }
  }
  
  // 3. Parse Beach Tent and Beach Mats (e.g. "Lều che nắng 300*280cm" or "Thảm dã ngoại xanh dương 140*200cm")
  if (t.includes("lều") || t.includes("leu") || t.includes("tent") || t.includes("che nắng") || t.includes("che nang")) {
    if (t.includes("300") && (t.includes("280") || t.includes("280cm"))) {
      return "tent_300_280";
    }
    if (t.includes("500") && (t.includes("300") || t.includes("300cm"))) {
      return "tent_500_300";
    }
  }

  if (t.includes("thảm") || t.includes("tham") || t.includes("mat") || t.includes("dã ngoại") || t.includes("da ngoai")) {
    const isBlueGrey = t.includes("xanh dương") || t.includes("xanh duong") || t.includes("grey") || t.includes("gray") || t.includes("xám") || t.includes("xam") || t.includes("蓝色+灰色") || t.includes("blue");
    const isLakeBlue = t.includes("xanh hồ") || t.includes("xanh ho") || t.includes("lake") || t.includes("deep blue") || t.includes("湖蓝+深蓝");
    
    let size = "";
    if (t.includes("140")) size = "140";
    else if (t.includes("210")) size = "210";

    if (isBlueGrey && size) {
      return `mat_blue_grey_${size}`;
    } else if (isLakeBlue && size) {
      return `mat_lake_blue_${size}`;
    }
  }
  
  // 4. Fallback: return raw title if no mapping is found
  return title;
}

/**
 * Serverless function to fetch inventory stock levels from a Notion database.
 * This runs on Netlify/Vercel.
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
        
        // Goldeneye Series (Out of Stock)
        "jig_goldeneye_1_16_5": 0,
        "jig_goldeneye_1_16_50": 0,
        "jig_goldeneye_1_8_5": 0,
        "jig_goldeneye_1_8_50": 0,
        "jig_goldeneye_1_4_5": 0,
        "jig_goldeneye_1_4_50": 0,
        "jig_goldeneye_5_16_5": 0,
        "jig_goldeneye_5_16_50": 0,
        "jig_goldeneye_3_8_5": 0,
        "jig_goldeneye_3_8_50": 0,
        "jig_goldeneye_1_2_5": 0,
        "jig_goldeneye_1_2_50": 0,

        // Black Platinum Series (Out of Stock)
        "jig_black_platinum_1_16_5": 0,
        "jig_black_platinum_1_16_50": 0,
        "jig_black_platinum_1_8_5": 0,
        "jig_black_platinum_1_8_50": 0,
        "jig_black_platinum_1_4_5": 0,
        "jig_black_platinum_1_4_50": 0,
        "jig_black_platinum_5_16_5": 0,
        "jig_black_platinum_5_16_50": 0,
        "jig_black_platinum_3_8_5": 0,
        "jig_black_platinum_3_8_50": 0,
        "jig_black_platinum_1_2_5": 0,
        "jig_black_platinum_1_2_50": 0,

        // Bullseye Series (Out of Stock)
        "jig_bullseye_1_16_5": 0,
        "jig_bullseye_1_16_50": 0,
        "jig_bullseye_1_8_5": 0,
        "jig_bullseye_1_8_50": 0,
        "jig_bullseye_1_4_5": 0,
        "jig_bullseye_1_4_50": 0,
        "jig_bullseye_5_16_5": 0,
        "jig_bullseye_5_16_50": 0,
        "jig_bullseye_3_8_5": 0,
        "jig_bullseye_3_8_50": 0,
        "jig_bullseye_1_2_5": 0,
        "jig_bullseye_1_2_50": 0,

        // Matrix Shad Colors (Out of Stock)
        "avocado_8": 0,
        "avocado_50": 0,
        "ultra_violet_8": 0,
        "ultra_violet_50": 0,
        "lemon_head_8": 0,
        "lemon_head_50": 0,

        // Beach Tent & Mats (Still in Stock)
        "tent_300_280": 25,
        "tent_500_300": 18,
        "mat_blue_grey_140": 50,
        "mat_blue_grey_210": 40,
        "mat_lake_blue_140": 35,
        "mat_lake_blue_210": 30
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
        const rawTitle = skuProp.title[0].plain_text.trim();
        const sku = mapNotionTitleToSKU(rawTitle);
        
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
