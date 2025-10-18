import { Column, Entity, Index, OneToMany, OneToOne, PrimaryGeneratedColumn } from "typeorm"
import { ParentChild } from "./ParentChild";
import { ChildActivitySession } from "./ChildActivitySession";
import { User } from "./User";
import { Feedback } from "./Feedback";
import { ClientStat } from "./ClientStat";

@Entity()
export class Parent {
    @PrimaryGeneratedColumn("uuid")
    id!: string;
    
    @Column({ type: 'varchar' })
    name!: string;
    
    @Index()
    @Column({ type: 'varchar', unique: true })
    email!: string;

    @Column({ type: 'varchar', nullable: true, select: false })
    password!: string;

    @Column({ type: 'varchar' })
    profilePictureURL!: string;

    @Column({ type: 'varchar' })
    phone!: string;

    @Column({ type: 'varchar' })
    address!: string;

    @Column({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
    createdAt!: Date;

    @Column({ type: 'timestamptz', nullable: true })
    activatedAt!: Date | null;

    @Column({ type: 'timestamptz', nullable: true })
    updatedAt!: Date | null;

    @OneToMany(() => ParentChild, parentChild => parentChild.parent)
    parentChildren!: ParentChild[];

    @OneToMany(() => ChildActivitySession, childActivitySession => childActivitySession.parent)
    parentChildActivitySession!: ChildActivitySession[];

    @OneToMany(() => Feedback, (feedback) => feedback.parent)
    feedbacks!: Feedback[];

    @OneToMany(() => ClientStat, (cs) => cs.parent)
    clientStats!: ClientStat[];

    @OneToOne(() => User)
    user!: User;
}
