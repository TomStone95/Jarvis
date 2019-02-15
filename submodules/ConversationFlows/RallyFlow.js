const rallyLib = require('../rallyLib');

const generatePlainAttachmentStr = require('../SlackHelpers/generatePlainAttachmentStr');
const addDeleteButton = require('../SlackHelpers/addDeleteButton');
const isCaseMentioned = require('../Regex/isCaseMentioned');

const handleConversationFn = (
  controller,
  bot,
  message,
  IDprefix,
  err,
  convo
) => {
  if (err) return err;

  const rallyID = message.match[1];

  //convo.say("Bringing up snapshot of the defect DE" + message.match[2]);
  controller.extDB.lookupUser(bot, message, (err, user) => {
    if (err) {
      console.error(
        `extDB.lookupUser failed when processing ${IDprefix} ID, due to error: ${err.message}`
      );
      convo.stop();
      return err;
    }

    rallyLib.queryRallyWithID(
      IDprefix,
      `${IDprefix}${rallyID}`,
      user.sf_username,
      result => {
        if (result.error) {
          const messageReply = generatePlainAttachmentStr(
            `Error fetching ${IDprefix}:${rallyID}:${message.match[2]}`,
            result.errorMSG
          );
          addDeleteButton(messageReply);

          convo.say(messageReply);
          convo.next();
          return true;
        }

        const messageReply = rallyLib.generateSnapshotAttachment(result);
        addDeleteButton(messageReply);

        convo.say(messageReply);
        convo.next();
        return true;
      }
    );
  });
};

module.exports = (controller, bot, message, IDprefix) => {
  // TODO: why was this here?
  // if (
  //   message.event == 'ambient' &&
  //   typeof message.thread_ts != 'undefined' &&
  //   isCaseMentioned(message.text)
  // ) {
  //   return true;
  // }

  // if a direct message, direct reply (no thread)
  if (message.type == 'direct_message') {
    bot.startConversation(message, (err, convo) =>
      handleConversationFn(controller, bot, message, IDprefix, err, convo)
    );
    return true;
  }

  // else, start thread (tidier)
  bot.startConversationInThread(message, (err, convo) =>
    handleConversationFn(controller, bot, message, IDprefix, err, convo)
  );
  return true;
};
