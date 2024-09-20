import mongoose, { Schema, Model, Document } from 'mongoose';

type DiveLogDocument = Document & {
  startTime: Date;
  endTime: Date;
  maxDepth: number;
  avgDepth: number;
  waterTemperature: number;
  airTemperature: number;
  tankMaterial: string;
  tankVolume: number;
  tankStartPressure: number;
  tankEndPressure: number;
  waterBody: string;
  location: string;
  visibility: number;
  additionalInfo: string;
  user: string;
};

type DiveLogInput = {
  startTime: DiveLogDocument['startTime'];
  endTime: DiveLogDocument['endTime'];
  maxDepth: DiveLogDocument['maxDepth'];
  avgDepth: DiveLogDocument['avgDepth'];
  waterTemperature: DiveLogDocument['waterTemperature'];
  airTemperature: DiveLogDocument['airTemperature'];
  tankMaterial: DiveLogDocument['tankMaterial'];
  tankVolume: DiveLogDocument['tankVolume'];
  tankStartPressure: DiveLogDocument['tankStartPressure'];
  tankEndPressure: DiveLogDocument['tankEndPressure'];
  waterBody: DiveLogDocument['waterBody'];
  location: DiveLogDocument['location'];
  visibility: DiveLogDocument['visibility'];
  additionalInfo: DiveLogDocument['additionalInfo'];
  user: DiveLogDocument['user'];
};

const diveLogsSchema = new Schema(
  {
    startTime: {
      type: Schema.Types.Date,
      required: true,
    },
    endTime: {
      type: Schema.Types.Date,
      required: true,
    },
    maxDepth: {
      type: Schema.Types.Number,
      required: true,
    },
    avgDepth: {
      type: Schema.Types.Number,
    },
    waterTemperature: {
      type: Schema.Types.Number,
    },
    airTemperature: {
      type: Schema.Types.Number,
    },
    tankMaterial: {
      type: String,
      enum: {
        values: ['Steel', 'Aluminium'],
        message: '{Value} is not a valid tank material',
      },
    },
    tankVolume: {
      type: Schema.Types.Number,
    },
    tankStartPressure: {
      type: Schema.Types.Number,
    },
    tankEndPressure: {
      type: Schema.Types.Number,
    },
    waterBody: {
      type: Schema.Types.String,
    },
    location: {
      type: Schema.Types.String,
      required: true,
    },
    visibility: {
      type: Schema.Types.String,
    },
    additionalInfo: {
      type: Schema.Types.String,
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
  },
  {
    collection: 'logs',
    timestamps: true,
  },
);

const DiveLog: Model<DiveLogDocument> = mongoose.model<DiveLogDocument>('DiveLog', diveLogsSchema);

export { DiveLog, DiveLogInput, DiveLogDocument };
