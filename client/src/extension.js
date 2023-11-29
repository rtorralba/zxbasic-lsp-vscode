const vscode = require('vscode');
const { LanguageClient, TransportKind } = require('vscode-languageclient');

let client;

const tokensAperture = ['IF', 'SUB', 'FUNCTION', 'FOR', 'WHILE', 'DO']
const tokensClosure = ['END', 'NEXT', 'WEND', 'LOOP']

const allZxBasicTokens = [
    "AS", "BEEP", "BIN", "BORDER", "BRIGHT", "CAT", "CIRCLE", "CLEAR", "CLOSE#", "CLS", "CONTINUE", "COPY", "DATA", "DEF FN", "DIM", "DRAW", "ERASE", "FLASH", "FORMAT", "FOR", "GO SUB", "GO TO", "IF", "END IF", "INK", "INPUT", "INVERSE", "LET", "LIST", "LLIST", "LOAD", "LPRINT", "MERGE", "MOVE", "NEW", "NEXT", "ON", "OUT", "OVER", "PAPER", "PAUSE", "PLOT", "POKE", "PRINT", "RANDOMIZE", "READ", "RESTORE", "RETURN", "RUN", "SAVE", "VERIFY", "AT", "LINE", "STEP", "TAB", "THEN", "TO", "STOP", "DO", "ELSE", "ELSEIF", "END", "EXIT", "FUNCTION", "GOTO", "GOSUB", "LOOP", "WEND", "WHILE", "BOLD", "ByRef", "ByVal", "CONST", "DECLARE", "FastCall", "ITALIC", "StdCall", "SUB", "UNTIL", "BANK", "LAYER", "PALETTE", "SPRITE", "TILE", "TO", "REMOUNT", "PWD", "CD", "MKDIR", "RMDIR", "ASM", "END ASM", "ALIGN",
    "AND", "NOT", "OR", "bAND", "bNOT", "bOR", "bXOR", "MOD", "SHL", "SHR", "XOR",
    "ABS", "ACS", "ASN", "ATN", "ATTR", "CHR$", "CODE", "COS", "EXP", "FN", "INKEY$", "INT", "IN", "LEN", "LN", "PEEK", "PI", "POINT", "RND", "SCREEN$", "SGN", "SIN", "SQR", "STR$", "TAN", "USR", "VAL$", "VAL", "ASC", "CAST", "CHR", "CSRLIN", "HEX", "HEX16", "GetKey", "MultiKeys", "GetKeyScanCode", "LBOUND", "LCase", "STR", "POS", "SCREEN", "UCase", "Print42", "PrintAt42", "Print64", "PrintAt64",
    "BYTE", "UBYTE", "INTEGER", "UINTEGER", "LONG", "ULONG", "STRING", "FIXED", "FLOAT",
    "#DEFINE", "#IFDEF", "#IFNDEF", "#ENDIF", "#INCLUDE ONCE", "#INCLUDE", "#INCBIN", "#PRAGMA", "#REQUIRE", "#IF", "#ELSE", "#ELIF", "#UNDEF", "#INIT", "#LINE", "#ERROR", "#WARNING"
];

const indentation = '    '
const indentationSize = 4

function activate(context) {
    let serverModule = context.asAbsolutePath('../server/src/server.js');
    client = new LanguageClient(
        'zxBasicLanguageServer',
        'ZX Basic Language Server',
        {
            run: { module: serverModule, transport: TransportKind.ipc },
            debug: { module: serverModule, transport: TransportKind.ipc, options: { execArgv: ['--nolazy', '--inspect=6009'] } }
        },
        {
            documentSelector: [{ scheme: 'file', language: 'zxbasic' }],
            synchronize: { fileEvents: vscode.workspace.createFileSystemWatcher('**/*.bas') }
        }
    );

    context.subscriptions.push(client.start());

    context.subscriptions.push(vscode.languages.registerDocumentFormattingEditProvider('zxbasic', {
        provideDocumentFormattingEdits(document) {
            let edits = [];
            let indentLevel = 0;

            for (let i = 0; i < document.lineCount; i++) {
                let line = document.lineAt(i);

                // Descartar lineas vacias
                if (line.isEmptyOrWhitespace) {
                    continue;
                }

                let leadingSpaces = line.text.match(/^(\s*)/)[0]; // get leading spaces
                let trimmedLine = line.text.trimStart(); // remove leading spaces
                let tokens = trimmedLine.split(/\s+/);
                tokens = tokens.map(token => allZxBasicTokens.includes(token.toUpperCase()) ? token.toUpperCase() : token);
                let newText = leadingSpaces + tokens.join(' '); // add leading spaces back
                let edit = vscode.TextEdit.replace(line.range, newText);
                edits.push(edit);
            
                // Editar la linea para quitar los espacios del final
                let lineText = line.text;
                let trimmedLineText = lineText.trimEnd();
                if (trimmedLineText !== lineText) {
                    let edit = vscode.TextEdit.replace(line.range, trimmedLineText);
                    edits.push(edit);
                }

                // Ajusta el nivel de indentación basado en la sintaxis de ZX Basic.
                let foundToken = tokens.find(token => tokensClosure.includes(token.toUpperCase()));
                if (foundToken) {
                    indentLevel = Math.max(indentLevel - 1, 0);
                    let leadingWhitespace = line.text.match(/^\s*/)[0];
                    let currentIndentLevel = leadingWhitespace.length / indentationSize;
                    if (currentIndentLevel > indentLevel) {
                        // Remover indentación adicional.
                        let start = line.range.start;
                        let end = start.translate({ characterDelta: (currentIndentLevel - indentLevel) * indentationSize });
                        let range = new vscode.Range(start, end);
                        let edit = vscode.TextEdit.replace(range, indentation.repeat(indentLevel));
                        edits.push(edit);
                    }
                }

                // Calcula la indentación correcta para esta línea.
                let correctIndent = indentation.repeat(indentLevel);

                // Si la línea no tiene la indentación correcta, crea una edición de texto para corregirla.
                if (!line.text.startsWith(correctIndent)) {
                    let firstNonWhitespaceCharacterIndex = line.text.search(/\S|$/);
                    let existingIndentation = line.text.slice(0, firstNonWhitespaceCharacterIndex);
                    let additionalIndent = correctIndent.slice(existingIndentation.length);
                    let indentRange = line.range.with({ start: firstNonWhitespaceCharacterIndex });
                    let edit = vscode.TextEdit.insert(indentRange.start, additionalIndent);
                    edits.push(edit);
                }
            
                // Ajusta el nivel de indentación basado en la sintaxis de ZX Basic.
                tokens = line.text.trim().split(/\s+/);
                foundToken = tokens.find(token => tokensAperture.includes(token.toUpperCase()));

                if (foundToken && !line.text.trim().toUpperCase().startsWith('END')) {
                    if (!line.text.includes('THEN ')) {
                        apertureIndentLevel = indentLevel;
                        indentLevel++;
                    }
                }
            }
    
            return edits;
        }
    }));
}

vscode.languages.registerCompletionItemProvider('zxbasic', {
    provideCompletionItems(document, position, token, context) {
        const range = document.getWordRangeAtPosition(position);
        const word = document.getText(range).toLowerCase();

        let matchingTokens = allZxBasicTokens.filter(token => token.toLowerCase().startsWith(word));
        return matchingTokens.map(token => new vscode.CompletionItem(token));
    }
});

vscode.languages.registerDefinitionProvider('zxbasic', {
    provideDefinition: async function(document, position, token) {
        const range = document.getWordRangeAtPosition(position);
        const word = document.getText(range);

        let definition = await findDefinition(word); // implement this function to find the definition of the word
        if (definition) {
            return new vscode.Location(definition.document, definition.range);
        }
    }
});

const path = require('path');
const fs = require('fs');

async function findDefinition(word) {
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (!workspaceFolders) {
        return;
    }

    for (const folder of workspaceFolders) {
        const folderUri = folder.uri;
        const pattern = new vscode.RelativePattern(folderUri, '**/*.bas'); // adjust the pattern to match your file types
        const files = await vscode.workspace.findFiles(pattern, null, 100); // adjust the maximum number of files as needed

        for (const file of files) {
            if (!file) {
                continue;
            }
            const text = fs.readFileSync(file.fsPath, 'utf8');
            const lines = text.split('\n');

            for (let i = 0; i < lines.length; i++) {
                const line = lines[i];
                if (line.startsWith('SUB ' + word) || line.startsWith('FUNCTION ' + word)) {
                    return {
                        document: vscode.Uri.file(file.fsPath),
                        range: new vscode.Range(new vscode.Position(i, 0), new vscode.Position(i, line.length))
                    };
                }
            }
        }
    }
    return undefined;
}

function deactivate() {
    if (!client) {
        return undefined;
    }
    return client.stop();
}

module.exports = {
    activate,
    deactivate
};