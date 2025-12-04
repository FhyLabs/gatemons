import fs from "fs";
import path from "path";
import { marked } from "marked";

export function Documentation(req, res) {
  const filePath = path.join(__dirname, "../database/docs/documentation.md");

  try {
    const markdown = fs.readFileSync(filePath, "utf8");
    const html = marked.parse(markdown);
    res.render("docs", { html });
  } catch (err) {
    console.error("File not found:", err.message);
    res.status(500).send("Documentation file not found.");
  }
}
