import { BadgeCriteria } from "@/helpers/types"
import { Check, Column, Entity, PrimaryGeneratedColumn } from "typeorm"


@Entity()
@Check(`"criteria" IN ('streak', 'distance', 'calories', 'weather', 'points', 'special', 'leaderboard', 'participation')`)
export class Badge {
    @PrimaryGeneratedColumn("uuid")
    id!: string

    @Column("varchar", { unique: true })
    name!: string

    @Column("varchar")
    description!: string

    @Column("varchar")
    imageUrl!: string

    @Column("varchar")
    criteria!: BadgeCriteria

    @Column({ type: "int", nullable: true })
    valueneeded!: number
}
