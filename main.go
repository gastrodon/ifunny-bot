package main

import (
	"os"
	"time"

	"github.com/open-ifunny/ifunny-go"
	"github.com/open-ifunny/ifunny-go/bot"
	"github.com/open-ifunny/ifunny-go/compose"
)

var bearer = os.Getenv("IFUNNY_BEARER")
var userAgent = os.Getenv("IFUNNY_USER_AGENT")

func main() {
	robot, err := bot.MakeBot(bearer, userAgent)
	if err != nil {
		panic(err)
	}

	robot.Chat.OnChannelUpdate(func(eventType int, channel *ifunny.ChatChannel) error {
		switch eventType {
		case ifunny.EVENT_JOIN:
			robot.Log.Infof(": [chatting in %s]", channel.Name)
			robot.Subscribe(channel.Name)
			return nil
		default:
			robot.Log.Infof("something else happened [%d]: %+v", eventType, channel)
		}

		return nil
	})

	robot.Chat.OnChannelInvite(func(eventType int, channel *ifunny.ChatChannel) error {
		robot.Log.Infof(": [invited to %s]", channel.Name)
		return robot.Chat.Call(compose.InviteResponse(channel.Name, true), nil)
	})

	robot.OnMessage(func(ctx bot.Context) error {
		evt, err := ctx.Event()
		if err != nil {
			return err
		}

		switch evt.Type {
		case ifunny.TEXT_MESSAGE:
			ctx.Robot().Log.Infof("- [%s]: %s", evt.User.Nick, evt.Text)
		case ifunny.JOIN_CHANNEL:
			ctx.Robot().Log.Infof(": [%s -> %s]", evt.User.Nick, evt.Channel)
		case ifunny.EXIT_CHANNEL:
			ctx.Robot().Log.Infof(": [%s -x %s]", evt.User.Nick, evt.Channel)
		default:
			ctx.Robot().Log.Infof("? [unknown: %d in %s]: %s", evt.Type, evt.Channel, evt.Text)
		}

		return nil
	})

	for {
		robot.Log.Info("listening")
		if err := robot.Listen(); err != nil {
			robot.Log.Errorf("error in listen: %s", err)
		}

		<-time.After(5 * time.Second)
		robot.Log.Info("reconnecting")
		chat, err := robot.Client.Chat()
		if err != nil {
			robot.Log.Errorf("err reconnecting: %s", err)
		}

		robot.Chat = chat
	}
}
