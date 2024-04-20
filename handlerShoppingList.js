
/**
 * Handles the shopping list based on the given message and type.
 * 
 * @param {string} msg - The message to be handled.
 * @param {string} type - The type of the message.
 * @param {string} connection - The database connection.
 */


function handlerShoppingList(connection, msg, type, ...params) {
    var message = {};
    switch (type) {
        case 'message':
            var lines = msg.body.split('\n');
            var messages = [];
            lines.forEach(function (line, idx) {
                // add an item to the shopping list
                if (line.startsWith('+')) {
                    line = line.substring(1).trim();
                    messages[idx] = {
                        "item_name": line,
                        "message_id": msg.id.id,
                        "sender_id": msg.from,
                        "submitted_at": new Date(msg.timestamp * 1000),
                    }
                    connection.query('SELECT * FROM SHOPPING_LIST_ITEMS WHERE item_name = ? AND bought = ?', [line, false], function (error, results, fields) {
                        if (error) throw error;
                        if (results.length > 0) {
                            msg.reply('Item ' + line + ' already exists in the shopping list');
                        } else {
                            connection.query('INSERT INTO SHOPPING_LIST_ITEMS SET ?', messages[idx], function (error, results, fields) {
                                if (error) {
                                    throw error;
                                } else {
                                    msg.reply('Item ' + line + ' added to the shopping list');
                                }
                            })

                        }
                    });

                } else if (line.startsWith('-')) { // remove an item from the shopping list
                    line = line.substring(1).trim();
                    deleteMessage(connection, line, msg);
                } else if (line.startsWith('*')) { // buy an item
                    buyItem(msg, msg.from, connection);
                }
                else if (line.toLowerCase() === 'list') { // list all items in the shopping list
                    connection.query('SELECT item_name FROM SHOPPING_LIST_ITEMS WHERE bought = 0', function (error, results, fields) {
                        if (error) throw error;
                        const items = results.map(result => result.item_name);
                        const message = items.length > 0 ? 'Shopping List:\n' + items.map(item => `- ${item}`).join('\n') : 'Shopping List is empty';
                        msg.reply(message);
                    });

                } else if (line.toLowerCase() === 'help') { // display help message
                    msg.reply('Welcome to the Shopping List Bot\n- To add an item to the shopping list, send a message starting with a plus (+) followed by the item name.\n- To list all items in the shopping list, send a message with the word "list".\n- To remove an item from the shopping list, either send a message starting with a dash (-) followed by the item name or just delete the original message For Everyone.\n- To mark an item as bought, either send a message starting with an asterisk (*) or send a react to the message with a check mark (✅)');
                }
            });
            break;
        case 'message_revoke_everyone':
            var messageBody = msg.body.toLowerCase().substring(1).trim();
            deleteMessage(connection, messageBody, msg);
            break;
        case 'reaction':
            if (params.length > 1 && params[0] === '✅') {
                var buyerId = params[1];
                var messageBody = buyItem(msg, buyerId, connection);
            }

    }
}

function buyItem(msg, buyerId, connection) {
    var messageBody = msg.body.toLowerCase().substring(1).trim();
    var bought = true;
    var boughtAt = new Date(msg.timestamp * 1000);
    connection.query('UPDATE SHOPPING_LIST_ITEMS SET buyer_id = ?, bought = ?, bought_at = ? WHERE item_name = ?', [buyerId, bought, boughtAt, messageBody], function (error, results, fields) {
        if (error) throw error;
        if (results.affectedRows > 0) {
            msg.reply('Item ' + messageBody + ' has been marked as bought');
            return;
        }
    });
    return messageBody;
}

function deleteMessage(connection, messageBody, msg) {
    connection.query('DELETE FROM SHOPPING_LIST_ITEMS WHERE item_name = ? AND bought = ?', [messageBody, false], function (error, results, fields) {
        if (error) throw error;
        if (results.affectedRows > 0) {
            msg.reply('Item ' + messageBody + ' removed from the shopping list');
            return;
        }
    });
}

module.exports = handlerShoppingList;


