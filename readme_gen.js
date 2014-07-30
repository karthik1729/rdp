var edde = require("edde");

var options = {
    start: /^(>>)(ed)/,
    end: /^__END__/,
    DEBUG: true,
    ignores: /(!|\?)\n/,
    dir: "."
}

edde.compile("*edde.md", options);

