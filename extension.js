const vscode = require("vscode");
const { GoogleGenerativeAI } = require("@google/generative-ai");

require("dotenv").config();

// Retrieve the API key from environment variables
const apiKey =process.env.GOOGLE_API_KEY;
const genAI = new GoogleGenerativeAI(apiKey);

const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

// Function to get AI completion
async function getCompletion(code) {
  const prompt = `As a professional software engineer, you are a code completion assistant.
  I want you to make suggestions and corrections based on the given code and make sure it follows the stantard procedures:
${code}
Please return only the corrected and suggested code.`;

  const result = await model.generateContent(prompt);
  const response = await result.response;
  const text = await response.text();
  return text;
}

/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {
  console.log('Congratulations, your extension "codeasistant" is now active!');

  const disposable = vscode.commands.registerCommand(
    "codeasistant.helloWorld",
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
                content: completion,
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
