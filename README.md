Few applications have been developed for my household using the incredible whatsappweb.js library.

## Requirements

- Node.js must be installed
- Use ```npm update``` to install all libraries from packages.json
- MySQL should be installed on the local machine
  - Set up the following environment variables: DB_HOST, DB_USER, DB_PASSWORD, DB_DATABASE
  - Utilize the scripts/create_db.sql file to create the initial user and database (replace the placeholders with actual values)
  - Use the scripts/create_table.sql file to create the necessary tables - ensure it is executed beforehand

- An OpenAI account is required, and the token should be set in the OPENAI_API_KEY environment variable

## Usage

With the whatsapp.js library, a cell number (referred to as The Bot) used as a Whatsapp user is necessary.
During the initial run, authentication of this user on whatsapp using a QR code is required. Subsequent runs will cache and 'remember' the authentication session.

### Applications

#### Voice to Text

Any voice message sent as a direct message to the bot will be replied with its text transcription.

#### Shopping List

Create a Shopping List Whatsapp group for family members and add the Bot to it.
Configure the group id in the config.json file
(Uncomment the line in getRouterName, so the bot provides the group id in the output of any group message he receives, so simply observe the output and add it to the file).
To view the actions that can be performed on the app, send the message 'help' within the group.

### Allowed List

The bot will only respond to messages received from a specific set of allowed numbers (i.e. family members).
This list should be configured in the config.json file.

Enjoy using these applications!
