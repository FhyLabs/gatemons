import fs from "fs";
import path from "path";
import { marked } from "marked";

export function Documentation(req, res) {
  const filePath = path.join(process.cwd(), "database", "docs", "documentation.md");

  const markdown = fs.readFileSync(filePath, "utf8");
  const html = marked.parse(markdown);

  res.render("docs", { html });
}
