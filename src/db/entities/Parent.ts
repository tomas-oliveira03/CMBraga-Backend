import { Column, Entity, Index, OneToMany, OneToOne, PrimaryGeneratedColumn } from "typeorm"
import { ParentChild } from "./ParentChild";
import { ChildActivitySession } from "./ChildActivitySession";
import { User } from "./User";
import { ParentStation } from "./ParentStation";
import { ParentStat } from "./ParentStat";
import { Survey } from "./Survey";

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

    @OneToMany(() => ParentStation, parentStation => parentStation.parent)
    parentStations!: ParentStation[];

    @OneToMany(() => ParentStat, (ps) => ps.parent)
    parentStats!: ParentStat[];

    @OneToMany(() => ChildActivitySession, childActivitySession => childActivitySession.parent)
    parentChildActivitySession!: ChildActivitySession[];

    @OneToMany(() => Survey, (cs) => cs.parent)
    parentSurveys!: Survey[];

    @OneToOne(() => User)
    user!: User;
}
