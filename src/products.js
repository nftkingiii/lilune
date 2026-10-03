// Everyday products mapped to the public companies behind them. Each link says
// why the company is connected, so the watchlist explains itself.
export const products = [
  { name: "ChatGPT", group: "AI", links: [["MSFT", "Major OpenAI investor; ChatGPT runs on Azure"], ["NVDA", "Its GPUs train and serve the models"]] },
  { name: "Copilot", group: "AI", links: [["MSFT", "Builds Copilot into Windows, Office and GitHub"]] },
  { name: "Gemini", group: "AI", links: [["GOOGL", "Google DeepMind builds Gemini"]] },
  { name: "Claude", group: "AI", links: [["AMZN", "Major Anthropic investor and cloud partner"], ["GOOGL", "Anthropic investor and cloud partner"]] },
  { name: "Meta AI", group: "AI", links: [["META", "Builds Meta AI and the open Llama models"]] },
  { name: "GeForce gaming", group: "AI", links: [["NVDA", "Designs the GeForce graphics cards"]] },
  { name: "iPhone", group: "Everyday", links: [["AAPL", "Designs and sells the iPhone"]] },
  { name: "AirPods", group: "Everyday", links: [["AAPL", "Designs and sells AirPods"]] },
  { name: "Gmail", group: "Everyday", links: [["GOOGL", "Runs Gmail and Google Workspace"]] },
  { name: "Google Maps", group: "Everyday", links: [["GOOGL", "Runs Google Maps"]] },
  { name: "Android", group: "Everyday", links: [["GOOGL", "Develops the Android operating system"]] },
  { name: "Amazon Prime", group: "Everyday", links: [["AMZN", "Runs Prime shopping and delivery"]] },
  { name: "Alexa", group: "Everyday", links: [["AMZN", "Makes Alexa and Echo devices"]] },
  { name: "Microsoft 365", group: "Everyday", links: [["MSFT", "Makes Word, Excel, Outlook and Teams"]] },
  { name: "LinkedIn", group: "Everyday", links: [["MSFT", "Owns LinkedIn"]] },
  { name: "YouTube", group: "Culture", links: [["GOOGL", "Owns YouTube"]] },
  { name: "Instagram", group: "Culture", links: [["META", "Owns Instagram"]] },
  { name: "WhatsApp", group: "Culture", links: [["META", "Owns WhatsApp"]] },
  { name: "Threads", group: "Culture", links: [["META", "Builds Threads"]] },
  { name: "Quest VR", group: "Culture", links: [["META", "Makes Quest headsets"]] },
  { name: "Xbox", group: "Culture", links: [["MSFT", "Owns Xbox and its game studios"]] },
  { name: "Twitch", group: "Culture", links: [["AMZN", "Owns Twitch"]] },
  { name: "Prime Video", group: "Culture", links: [["AMZN", "Runs Prime Video"]] },
  { name: "Apple Music", group: "Culture", links: [["AAPL", "Runs Apple Music and Apple TV+"]] },
  { name: "AWS", group: "Building", links: [["AMZN", "Runs Amazon Web Services"]] },
  { name: "Azure", group: "Building", links: [["MSFT", "Runs the Azure cloud"]] },
  { name: "GitHub", group: "Building", links: [["MSFT", "Owns GitHub"]] },
  { name: "Google Cloud", group: "Building", links: [["GOOGL", "Runs Google Cloud"]] },
];

const names = { NVDA: "NVIDIA", AAPL: "Apple", MSFT: "Microsoft", AMZN: "Amazon", GOOGL: "Alphabet", META: "Meta" };
export const companyName = (symbol) => names[symbol] || symbol;
