function copyToClipboard(content) {
    navigator.clipboard.writeText(content).then(function() {
        //log('Async: Copying to clipboard was successful!')
    }, function(err) {
    console.error('Async: Could not copy text: ', err);
    });
}

export {
    copyToClipboard
}
