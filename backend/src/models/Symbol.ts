import { Sequelize, DataTypes, Optional, Model } from "sequelize";

interface SymbolAttributes {
    id: string;
    filename: string;
    path: string;
    serveCount: number;
}

interface SymbolCreationAttributes extends Optional<SymbolAttributes, 'serveCount'> { };

export class Symbol extends Model<SymbolAttributes, SymbolCreationAttributes> implements SymbolAttributes {
    public id!: string;
    public filename!: string;
    public path!: string;
    public serveCount!: number;

    // timestamps!
    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;
};

export const LoadSymbolModel = (sequelizeDb: Sequelize) => {
    return Symbol.init({
        id: { type: DataTypes.STRING, primaryKey: true },
        filename: { type: DataTypes.STRING, allowNull: false },
        path: { type: DataTypes.STRING, allowNull: false },
        serveCount: { type: DataTypes.NUMBER, allowNull: false, defaultValue: 0 }
    }, {
        sequelize: sequelizeDb
    }
    );
}

