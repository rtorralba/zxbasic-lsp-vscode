const { createConnection, TextDocuments, ProposedFeatures } = require('vscode-languageserver');

// Create a connection for the server.
let connection = createConnection(ProposedFeatures.all);

// Create a simple text document manager.
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

// Make the text document manager listen on the connection
documents.listen(connection);

// Listen on the connection
connection.listen();