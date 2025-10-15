import { Check, Column, Entity, ManyToOne, OneToMany, OneToOne, PrimaryGeneratedColumn } from "typeorm";
import { TypeOfChat } from "@/helpers/types";
import { Message } from "./Message";
import { UserChat } from "./UserChat";

@Entity()
@Check(`"chat_type" IN ('group_chat', 'individual_chat')`)
export class Chat {
    @PrimaryGeneratedColumn("uuid")
    id!: string;

    @Column({ type: 'varchar', nullable: true })
    chatName!: string | null;

    @Column({ type: 'varchar'})
    chatType!: TypeOfChat;

    @Column({ type: 'varchar'})
    destinatairePhoto!: string;

    @OneToMany(() => Message, message => message.chat)
    messages!: Message[];

    @OneToMany(() => UserChat, userChat => userChat.chat)
    userChat!: UserChat[];
}
