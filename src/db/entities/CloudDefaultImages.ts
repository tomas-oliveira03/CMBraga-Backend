import { DefaultImageType } from "@/helpers/types";
import { Column, Entity, Index, PrimaryGeneratedColumn } from "typeorm"

@Entity()
export class CloudDefaultImages {
    @PrimaryGeneratedColumn("uuid")
    id!: string;

    @Index()
    @Column({ type: 'varchar' })
    fileName!: string;

    @Column({ type: 'varchar' })
    imageType!: DefaultImageType;

    @Column({ type: 'varchar' })
    imageUrl!: string;

}
