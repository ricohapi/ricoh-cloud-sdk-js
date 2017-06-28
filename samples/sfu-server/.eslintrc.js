module.exports = {
    "env": {
        "browser": true,
        "es6": true
    },
    "extends": "airbnb",
    "plugins" : [
        "react"
    ],
    "parserOptions": {
        "sourceType": "module"
    },
    "rules": {
        "object-shorthand": 0,
        "func-names": 0,
        "no-console": 0,
        "no-underscore-dangle": 0,
        "no-mixed-operators": 0,
        "indent": [
            "error",
            2
        ],
        "linebreak-style": [
            "error",
            "unix"
        ],
        "quotes": [
            "error",
            "single"
        ],
        "semi": [
            "error",
            "always"
        ]
    }
};
