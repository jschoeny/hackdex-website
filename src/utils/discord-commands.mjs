export const discordGuildCommands = [
  {
    type: 1,
    name: "reply",
    description: "Email the person this thread is about",
  },
  {
    type: 1,
    name: "recover-ticket",
    description: "Create a Discord thread for a contact ticket",
    options: [
      {
        type: 3,
        name: "id",
        description: "Ticket ID, like HDX-AB12CD",
        required: true,
      },
    ],
  },
];
