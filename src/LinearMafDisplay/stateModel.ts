import { types } from 'mobx-state-tree'

export default function stateModelFactory() {
  return types.model('LinearMafDisplay', { type: 'LinearMafDisplay' })
}
