import { PrismaClient } from "@prisma/client"
import express from "express"

const app=express()
const prisma=new PrismaClient({
    log:['query']
})
const PORT =process.env.PORT ||3000

app.use(express.json())

// ---users---//
app.post('/users', async (req, res) => {
  const { name, email,date } = req.body;
  try {
    const user = await prisma.user.create({
      data: { 
         name,
         email,
         date
         },
    });
    res.status(201).json(user);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.get('/users/:id', async (req, res) => {
  const userId = parseInt(req.params.id);

  try {
    const user = await prisma.user.findUnique({
      where: { 
        id: userId
       },
      include: {
        Chat: true, 
        Message: {
          include: {
            replies: true,
          },
        },
      },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.status(200).json(user);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.get('/users', async (req, res) => {
  try {
    const user = await prisma.user.findMany({
      include: {
          Chat: true,
          Message: true
          },
    });
    res.json(user);
  } catch (error) {
    res.status(404).json({ error: error.message });
  }
});

app.put('/users/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const user = await prisma.user.update({
      where: { 
        id: parseInt(id) 
    },
      data:req.body
    });
    res.json(user);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});
app.delete('/users/:id', async (req, res) => {
  
  try {
    const delUser=await prisma.user.delete({
      where: { 
        id:+req.params.id 
         }
    });
    res.status(200).json(delUser);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});
// ---chat---//

app.post('/chats', async (req, res) => {
  const { userIds } = req.body;
  try {
    const chat = await prisma.chat.create({
      data: {
        users: {
          connect: userIds.map(id => ({ id })),
        },
      },
    });
    res.status(201).json(chat);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.get('/chats/:id', async (req, res) => {
  const id = +req.params.id;
  try {
    const chat = await prisma.chat.findFirst({
      where: { 
        id:id
     },
      include: {
         users: true,
         Message:true,
         },
    });
    res.status(200).json(chat);
  } catch (error) {
    res.status(404).json({ error: error.message });
  }
});




app.put('/chats/:id/addSingleUser', async (req, res) => {
  const chatId = +req.params.id;
  const userId = req.body.userId;

  try {

    const chat = await prisma.chat.findFirst({
      where: {
         id: chatId
         },
      include: {
         users: true
         },
    });

    if (!chat) {
      throw new Error('Chat not found');
    }
    
    if (chat.users.some(u => u.id === userId)) {
      throw new Error('User already in the chat');
    }

    const updatedChat = await prisma.chat.update({
      where: {
         id: chatId
         },
      data: {
        users: {
          connect: { 
            id: userId
           },
        },
      },
      include: { 
        users: true
         },
    });

    res.json(updatedChat);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});


app.put('/chats/:id/addUsers', async (req, res) => {
  const chatId = +req.params.id;
  const newUsers = req.body.newUsers;

  try {
    
    const chat = await prisma.chat.findUnique({
      where: { 
        id: chatId
         },
      include: { 
        users: true
         },
    });

    if (!chat) {
      throw new Error('Chat not found');
    }

    const updatedUserIds = [...new Set([...chat.users.map(user => user.id), ...newUsers])];
    
    const updatedChat = await prisma.chat.update({
      where: {
         id: chatId 
            },
      data: {
        users: {
          set: updatedUserIds.map(id => ({ id })),
        },
      },
      include: {
         users: true
            },
    });

    res.json(updatedChat);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});


app.delete('/delChats/:id', async (req, res) => {
  const id = +req.params.id;
  try {
    const delChat =await prisma.chat.delete({
      where: {
         id:id
        }
    });
    res.status(200).json(delChat);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.put('/chats/:id/removeUser', async (req, res) => {
  const chatId = +req.params.id;
  const userId = req.body.userId;

  try {
    const chat = await prisma.chat.findFirst({
      where: { 
        id: chatId 
           },
      include: { 
        users: true
            },
    });

    if (!chat) {
      throw new Error('Chat not found');
    }
    
    if (!chat.users.some(u => u.id === userId)) {
      throw new Error('User not in the chat');
    }

    const updatedChat = await prisma.chat.update({
      where: { 
        id: chatId
          },
      data: {
        users: {
          disconnect: {
             id: userId
             },
        },
      },
      include: { 
        users: true
        },
    });

    res.json(updatedChat);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.put('/chats/:id/removeUsers', async (req, res) => {
  const chatId = +req.params.id;
  const userIds = req.body.userIds;

  try {
    const chat = await prisma.chat.findFirst({
      where: {
         id: chatId
         },
      include: {
         users: true
         },
    });

    if (!chat) {
      throw new Error('Chat not found');
    }
    
    const usersToRemove = chat.users.filter(u => userIds.includes(u.id));

    if (usersToRemove.length === 0) {
      throw new Error('None of the specified users are in the chat');
    }

    const updatedChat = await prisma.chat.update({
      where: {
         id: chatId
         },
      data: {
        users: {
          disconnect: usersToRemove.map(u => ({ id: u.id })),
        },
      },
      include: { users: true },
    });

    res.json(updatedChat);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// ----messages-----//

app.post('/chats/:chatId/users/:userId/messages', async (req, res) => {
  const { chatId, userId } = req.params;
  const { content } = req.body;

  try {

    const chat = await prisma.chat.findUnique({ 
        where: {
             id: parseInt(chatId)
             }
     });
    const user = await prisma.user.findUnique({
         where: {
             id: parseInt(userId)
             }
     });

    if (!chat) {
      throw new Error('Chat not found');
    }
    if (!user) {
      throw new Error('User not found');
    }

    const message = await prisma.message.create({
      data: {
        content: content,
        chatId: parseInt(chatId),
        userId: parseInt(userId),
      },
    });

    res.status(201).json(message);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.post('/messages/:messageId/reply', async (req, res) => {
  const messageId = +req.params.messageId;
  const { userId, content } = req.body;

  try {
    const originalMessage = await prisma.message.findUnique({
      where: { id:messageId },
      include: { chat: true },
    });

    if (!originalMessage) {
      return res.status(404).json({ error: 'Original message not found' });
    }

    const replyMessage = await prisma.message.create({
      data: {
        content: content,
        sentAt: new Date(),
        chatId: originalMessage.chatId,
        userId: parseInt(userId),
        parentId: originalMessage.id,
      },
    });

    res.status(201).json(replyMessage);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});


app.get('/users/:userId/messages', async (req, res) => {
  const userId = parseInt(req.params.userId);

  try {
    const user = await prisma.user.findUnique({
        where: {
             id: userId
             }, 
    });

    if (!user) {
      throw new Error('User not found');
    }

    const messages = await prisma.message.findMany({
      where: { 
        userId: userId
     },
      include: {
        chat: true,
      },
    });

    res.status(200).json(messages);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});


app.get('/messages', async (req, res) => {
  try {
    const messages = await prisma.message.findMany({
      include: {
        user: true, 
        chat: true, 
      },
    });

    res.status(200).json(messages);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.delete('/chats/:chatId/users/:userId/messages', async (req, res) => {
  const { chatId, userId } = req.params;
  const { messageId } = req.body;

  try {
    const message = await prisma.message.findFirst({
      where: {
        id: parseInt(messageId),
        chatId: parseInt(chatId),
        userId: parseInt(userId),
      },
    });

    if (!message) {
      return res.status(404).json({ error: 'Message not found or does not belong to the specified chat and user' });
    }
    const delSingleMess = await prisma.message.delete({
      where: {
         id: parseInt(messageId)
         },
    });

    res.status(200).json(delSingleMess);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});


app.delete('/users/:userId/messages', async (req, res) => {
  const userId = parseInt(req.params.userId);

  try {
    const user = await prisma.user.findUnique({ 
        where: {
             id: userId
             }
     });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    const delAllMess = await prisma.message.deleteMany({
      where: {
         userId: userId
         },
    });

    res.status(200).json(delAllMess);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.delete('/chats/:chatId/messages', async (req, res) => {
  const chatId = parseInt(req.params.chatId);

  try {
    const chat = await prisma.chat.findUnique({
         where: {
             id: chatId
             }
     });

    if (!chat) {
      return res.status(404).json({ error: 'Chat not found' });
    }
    await prisma.message.deleteMany({
      where: {
         chatId: chatId
         },
    });

    res.status(200).json({ message: 'All messages in the chat have been deleted successfully' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});



app.listen(PORT,()=>{
    console.log(`Server is running on port ${PORT}`)

})