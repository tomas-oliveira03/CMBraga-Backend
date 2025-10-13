import { Column, Entity, PrimaryGeneratedColumn } from "typeorm"

@Entity()
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
    criteria!: string

    @Column({ type: "int", nullable: true })
    valueneeded!: number
}
