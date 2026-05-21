import { RecipeForm } from '../RecipeForm'
import { addRecipe } from './actions'

export default function NewRecipePage() {
  return <RecipeForm mode="create" action={addRecipe} />
}
