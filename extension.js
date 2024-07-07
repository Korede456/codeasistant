const vscode = require("vscode");
const { GoogleGenerativeAI } = require("@google/generative-ai");

require("dotenv").config();

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);

const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

// Function to get AI completion with suggestions based on runtime speed and efficiency
async function getCompletion(code) {
  const prompt = `As a professional software engineer, you are a code completion assistant. 
  Please make suggestions and corrections based on the given code, ensuring it follows standard procedures. 
  Evaluate the code on runtime speed and efficiency, and provide improved code suggestions.
  Given code:
  ${code}
  `;

  const result = await model.generateContent(prompt);
  const response = await result.response;
  const text = await response.text();
  return text;
}

// Function to remove the first and last lines of the completion text
function removeFirstAndLastLine(text) {
  const lines = text.trim().split("\n");
  if (lines.length <= 2) {
    return ""; // If there are less than 3 lines, return an empty string
  }
  return lines.slice(1, -1).join("\n");
}

/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {
  console.log('Congratulations, your extension "CodeAssist" is now active!');

  const disposable = vscode.commands.registerCommand(
    "code.assist",
    async function () {
      // Get the active text editor
      const editor = vscode.window.activeTextEditor;
      if (!editor) {
        vscode.window.showInformationMessage("No active editor found!");
        return;
      }

      // Get the selected code or the entire document
      const selection = editor.selection;
      const code = selection.isEmpty
        ? editor.document.getText()
        : editor.document.getText(selection);

      // Fetch AI completion
      const completion = await getCompletion(code);
      if (completion) {
        const cleanedCompletion = removeFirstAndLastLine(completion);
        const openSuggestionAction = "Open Suggestion";
        vscode.window
          .showInformationMessage(
            "AI completion is ready.",
            openSuggestionAction
          )
          .then(async (selection) => {
            if (selection === openSuggestionAction) {
              const languageExtension = editor.document.languageId;
              const newDocument = await vscode.workspace.openTextDocument({
                content: cleanedCompletion,
                language: languageExtension,
              });

              await vscode.window.showTextDocument(newDocument, {
                preview: false,
                viewColumn: vscode.ViewColumn.Beside,
              });
            }
          });
      } else {
        vscode.window.showErrorMessage("Failed to fetch AI completion.");
      }
    }
  );

  context.subscriptions.push(disposable);
}

// This method is called when your extension is deactivated
function deactivate() {}

module.exports = {
  activate,
  deactivate,
};
