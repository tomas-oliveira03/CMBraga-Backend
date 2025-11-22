import { Column, Entity, Index, ManyToOne, PrimaryGeneratedColumn } from "typeorm"
import { Child } from "./Child";

@Entity()
export class ChildHistory {
    @PrimaryGeneratedColumn("uuid")
    id!: string;

    @Index()
    @Column({ type: 'varchar' })
    childId!: string;

    @Column({ type: 'int', nullable: true, default: null })
    heightCentimeters!: number | null;

    @Column({ type: 'int', nullable: true, default: null })
    weightKilograms!: number | null; 

    @Column({ type: 'int', nullable: true, default: null })
    cortisolLevel!: number | null;

    @Column({ type: 'int'})
    age!: number;

    @Column({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
	createdAt!: Date | null;

    @ManyToOne(() => Child)
    child!: Child;





}
