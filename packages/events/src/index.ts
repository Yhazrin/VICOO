export type EventPayload = Record<string, unknown>;

export interface VicooEvent<T extends EventPayload = EventPayload> {
  type: string;
  payload: T;
}
