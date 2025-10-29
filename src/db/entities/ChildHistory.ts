import { Column, Entity, Index, ManyToOne, PrimaryGeneratedColumn } from "typeorm"
import { Child } from "./Child";

@Entity()
export class ChildHistory {
    @PrimaryGeneratedColumn("uuid")
    id!: string;

    @Index()
    @Column({ type: 'varchar' })
    childId!: string;

    @Column({ type: 'int'})
    heightCentimeters!: number;

    @Column({ type: 'int'})
    weightKilograms!: number; 

    @Column({ type: 'int'})
    age!: number;

    @Column({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
	createdAt!: Date | null;

    @ManyToOne(() => Child)
    child!: Child;





}
