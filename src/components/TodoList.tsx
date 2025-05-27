
import React, { useState } from 'react';
import { Plus, Check, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from '@/hooks/use-toast';

interface Todo {
  id: number;
  text: string;
  completed: boolean;
  isAnimating?: boolean;
}

const TodoList = () => {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [inputValue, setInputValue] = useState('');

  const addTodo = () => {
    if (inputValue.trim() === '') {
      toast({
        title: "Empty task",
        description: "Please enter a task before adding.",
        variant: "destructive"
      });
      return;
    }

    const newTodo: Todo = {
      id: Date.now(),
      text: inputValue.trim(),
      completed: false,
      isAnimating: true
    };

    setTodos(prev => [...prev, newTodo]);
    setInputValue('');
    
    // Remove animation flag after animation completes
    setTimeout(() => {
      setTodos(prev => prev.map(todo => 
        todo.id === newTodo.id ? { ...todo, isAnimating: false } : todo
      ));
    }, 600);

    toast({
      title: "Task added!",
      description: "Your new task has been added to the list."
    });
  };

  const toggleTodo = (id: number) => {
    setTodos(prev => prev.map(todo => 
      todo.id === id ? { ...todo, completed: !todo.completed } : todo
    ));
  };

  const deleteTodo = (id: number) => {
    setTodos(prev => prev.filter(todo => todo.id !== id));
    toast({
      title: "Task deleted",
      description: "The task has been removed from your list."
    });
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      addTodo();
    }
  };

  const completedCount = todos.filter(todo => todo.completed).length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">Todo List</h1>
          <p className="text-gray-600">Stay organized and get things done!</p>
          {todos.length > 0 && (
            <div className="mt-4 text-sm text-gray-500">
              {completedCount} of {todos.length} tasks completed
            </div>
          )}
        </div>

        {/* Add Todo Form */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6 border border-gray-100">
          <div className="flex gap-3">
            <Input
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="What needs to be done?"
              className="flex-1 text-lg py-3 px-4 border-gray-200 focus:border-blue-400 focus:ring-blue-400 rounded-xl"
            />
            <Button
              onClick={addTodo}
              className="px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-xl transition-all duration-200 hover:scale-105 shadow-md"
            >
              <Plus className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Todo List */}
        <div className="space-y-3">
          {todos.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">📝</div>
              <h3 className="text-xl font-semibold text-gray-600 mb-2">No tasks yet</h3>
              <p className="text-gray-500">Add your first task above to get started!</p>
            </div>
          ) : (
            todos.map((todo) => (
              <div
                key={todo.id}
                className={`bg-white rounded-xl shadow-md border border-gray-100 p-4 transition-all duration-300 hover:shadow-lg hover:scale-[1.02] ${
                  todo.isAnimating ? 'animate-bounce-in' : ''
                } ${todo.completed ? 'opacity-75' : ''}`}
              >
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => toggleTodo(todo.id)}
                    className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all duration-200 ${
                      todo.completed
                        ? 'bg-green-500 border-green-500 text-white'
                        : 'border-gray-300 hover:border-green-400'
                    }`}
                  >
                    {todo.completed && (
                      <Check className="w-4 h-4 animate-check-mark" />
                    )}
                  </button>
                  
                  <span
                    className={`flex-1 text-lg transition-all duration-200 ${
                      todo.completed
                        ? 'line-through text-gray-500'
                        : 'text-gray-800'
                    }`}
                  >
                    {todo.text}
                  </span>
                  
                  <button
                    onClick={() => deleteTodo(todo.id)}
                    className="p-2 text-gray-400 hover:text-red-500 transition-colors duration-200 hover:bg-red-50 rounded-lg"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Progress Bar */}
        {todos.length > 0 && (
          <div className="mt-8 bg-white rounded-xl shadow-md p-6 border border-gray-100">
            <div className="flex justify-between items-center mb-3">
              <span className="text-sm font-medium text-gray-700">Progress</span>
              <span className="text-sm text-gray-500">
                {Math.round((completedCount / todos.length) * 100)}%
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-gradient-to-r from-green-400 to-green-500 h-2 rounded-full transition-all duration-500 ease-out"
                style={{
                  width: `${(completedCount / todos.length) * 100}%`
                }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TodoList;
