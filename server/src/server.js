const { createConnection, TextDocuments, ProposedFeatures } = require('vscode-languageserver');

let connection = createConnection(ProposedFeatures.all);
let documents = new TextDocuments();

connection.onInitialize(() => {
    return {
        capabilities: {
            textDocumentSync: documents.syncKind
        }
    };
});

documents.onDidOpen(e => {
    connection.console.log(`Document opened: ${e.document.uri}`);
});

documents.listen(connection);
connection.listen();