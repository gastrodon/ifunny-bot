[![ifunny-bot](https://img.shields.io/badge/iFunny-DanBooru-%23ffcb3d)](https://ifunny.co/user/DanBooru)
[![ifunny-bot](https://img.shields.io/badge/Owner-Gastrodon-%23ffcb3d)](https://ifunny.co/user/Gastrodon)

### The iFunny bot Booru (now DanBooru)

This is the code ran for the iFunny bots Booru and DanBooru. I've made it open source so that anyone else interested in iFunny development might learn from it

#### Getting started
Populate a file `config.json` in the bot's root with the following format:

```json
{
    "email": "ifunny_account_email",
    "password": "ifunny_password",
}
```

If you want to use the commands `dan` and `tags`, add the following keys:

```json
{
    "dan_key": "danbooru_api_key",
    "dan_login": "danbooru_username"
}
```

They are needed to talk to the danbooru api

##### Contributing
If you'd like to, feel free to contribute to this repo, or create your own fork.

##### Dependencies
Important npm dependencies:
- ifunny
- puppeteer
- axios
