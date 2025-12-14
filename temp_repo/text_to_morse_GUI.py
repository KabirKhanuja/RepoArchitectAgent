import tkinter as tk
from tkinter import ttk, messagebox, scrolledtext
import threading
import time
import winsound  # For Windows sound - use 'os' module for cross-platform

class MorseCodeConverter:
    def __init__(self):
        # Morse code dictionary
        self.morse_dict = {
            'A': '.-', 'B': '-...', 'C': '-.-.', 'D': '-..', 'E': '.', 'F': '..-.',
            'G': '--.', 'H': '....', 'I': '..', 'J': '.---', 'K': '-.-', 'L': '.-..',
            'M': '--', 'N': '-.', 'O': '---', 'P': '.--.', 'Q': '--.-', 'R': '.-.',
            'S': '...', 'T': '-', 'U': '..-', 'V': '...-', 'W': '.--', 'X': '-..-',
            'Y': '-.--', 'Z': '--..', '1': '.----', '2': '..---', '3': '...--',
            '4': '....-', '5': '.....', '6': '-....', '7': '--...', '8': '---..',
            '9': '----.', '0': '-----', ',': '--..--', '.': '.-.-.-', '?': '..--..',
            '/': '-..-.', '-': '-....-', '(': '-.--.', ')': '-.--.-', ' ': '/'
        }
        
        # Reverse dictionary for morse to text conversion
        self.text_dict = {v: k for k, v in self.morse_dict.items()}
        
        self.setup_gui()
    
    def setup_gui(self):
        # Create main window
        self.root = tk.Tk()
        self.root.title("Text ⟷ Morse Code Converter")
        self.root.geometry("800x600")
        self.root.configure(bg='#2c3e50')
        
        # Configure style for ttk widgets
        style = ttk.Style()
        style.theme_use('clam')
        style.configure('TLabel', background='#2c3e50', foreground='white', font=('Arial', 11))
        style.configure('TButton', font=('Arial', 10, 'bold'))
        style.configure('Title.TLabel', font=('Arial', 16, 'bold'))
        
        # Main title
        title_label = ttk.Label(self.root, text="Text ⟷ Morse Code Converter", style='Title.TLabel')
        title_label.pack(pady=20)
        
        # Create main frame
        main_frame = tk.Frame(self.root, bg='#2c3e50')
        main_frame.pack(fill='both', expand=True, padx=20, pady=10)
        
        # Input section
        input_frame = tk.Frame(main_frame, bg='#34495e', relief='raised', bd=2)
        input_frame.pack(fill='both', expand=True, pady=(0, 10))
        
        ttk.Label(input_frame, text="Input Text:", style='TLabel').pack(anchor='w', padx=10, pady=(10, 5))
        
        self.input_text = scrolledtext.ScrolledText(
            input_frame, 
            height=8, 
            font=('Consolas', 11),
            bg='#ecf0f1',
            fg='#2c3e50',
            insertbackground='#2c3e50'
        )
        self.input_text.pack(fill='both', expand=True, padx=10, pady=(0, 10))
        
        # Button frame
        button_frame = tk.Frame(main_frame, bg='#2c3e50')
        button_frame.pack(pady=10)

        # Conversion buttons
        self.text_to_morse_btn = ttk.Button(
            button_frame, 
            text="Text → Morse Code", 
            command=self.convert_text_to_morse
        )
        self.text_to_morse_btn.pack(side='left', padx=5)
        
        self.morse_to_text_btn = ttk.Button(
            button_frame, 
            text="Morse Code → Text", 
            command=self.convert_morse_to_text
        )
        self.morse_to_text_btn.pack(side='left', padx=5)
        
        # Clear and copy buttons
        self.clear_btn = ttk.Button(
            button_frame, 
            text="Clear All", 
            command=self.clear_all
        )
        self.clear_btn.pack(side='left', padx=5)
        
        self.copy_btn = ttk.Button(
            button_frame, 
            text="Copy Output", 
            command=self.copy_output
        )
        self.copy_btn.pack(side='left', padx=5)
        
        # Play morse code button
        self.play_btn = ttk.Button(
            button_frame, 
            text="Play Morse", 
            command=self.play_morse_code
        )
        self.play_btn.pack(side='left', padx=5)
        
        # Output section
        output_frame = tk.Frame(main_frame, bg='#34495e', relief='raised', bd=2)
        output_frame.pack(fill='both', expand=True, pady=(10, 0))
        
        ttk.Label(output_frame, text="Output:", style='TLabel').pack(anchor='w', padx=10, pady=(10, 5))
        
        self.output_text = scrolledtext.ScrolledText(
            output_frame, 
            height=8, 
            font=('Consolas', 11),
            bg='#ecf0f1',
            fg='#2c3e50',
            insertbackground='#2c3e50',
            state='disabled'
        )
        self.output_text.pack(fill='both', expand=True, padx=10, pady=(0, 10))
        
        # Status bar
        self.status_var = tk.StringVar()
        self.status_var.set("Ready")
        status_bar = tk.Label(
            self.root, 
            textvariable=self.status_var, 
            relief='sunken', 
            anchor='w',
            bg='#95a5a6',
            fg='#2c3e50',
            font=('Arial', 9)
        )
        status_bar.pack(side='bottom', fill='x')
        
        # Bind Enter key to text-to-morse conversion
        self.input_text.bind('<Control-Return>', lambda e: self.convert_text_to_morse())
    
    def convert_text_to_morse(self):
        """Convert text to morse code"""
        try:
            input_text = self.input_text.get('1.0', tk.END).strip().upper()
            if not input_text:
                messagebox.showwarning("Input Error", "Please enter some text to convert!")
                return
            
            morse_code = []
            for char in input_text:
                if char in self.morse_dict:
                    morse_code.append(self.morse_dict[char])
                elif char == ' ':
                    morse_code.append('/')
                else:
                    continue
            
            result = ' '.join(morse_code)

            self.output_text.config(state='normal')
            self.output_text.delete('1.0', tk.END)
            self.output_text.insert('1.0', result)
            self.output_text.config(state='disabled')
            
            self.status_var.set(f"Converted {len(input_text)} characters to Morse code")
            
        except Exception as e:
            messagebox.showerror("Conversion Error", f"An error occurred: {str(e)}")
    
    def convert_morse_to_text(self):
        """Convert morse code to text"""
        try:
            input_morse = self.input_text.get('1.0', tk.END).strip()
            if not input_morse:
                messagebox.showwarning("Input Error", "Please enter morse code to convert!")
                return
            
            # Split by spaces and convert each morse code
            morse_chars = input_morse.split(' ')
            text_result = []
            
            for morse_char in morse_chars:
                if morse_char in self.text_dict:
                    text_result.append(self.text_dict[morse_char])
                elif morse_char == '/':
                    text_result.append(' ')
                elif morse_char == '':
                    continue
                else:
                    text_result.append('?')
            
            result = ''.join(text_result)
            
            self.output_text.config(state='normal')
            self.output_text.delete('1.0', tk.END)
            self.output_text.insert('1.0', result)
            self.output_text.config(state='disabled')
            
            self.status_var.set(f"Converted Morse code to {len(result)} characters")
            
        except Exception as e:
            messagebox.showerror("Conversion Error", f"An error occurred: {str(e)}")
    
    def clear_all(self):
        """Clear both input and output text areas"""
        self.input_text.delete('1.0', tk.END)
        self.output_text.config(state='normal')
        self.output_text.delete('1.0', tk.END)
        self.output_text.config(state='disabled')
        self.status_var.set("Text cleared")
    
    def copy_output(self):
        """Copy output text to clipboard"""
        try:
            output_content = self.output_text.get('1.0', tk.END).strip()
            if output_content:
                self.root.clipboard_clear()
                self.root.clipboard_append(output_content)
                self.status_var.set("Output copied to clipboard")
            else:
                messagebox.showinfo("Copy", "No output to copy!")
        except Exception as e:
            messagebox.showerror("Copy Error", f"Failed to copy: {str(e)}")
    
    def play_morse_code(self):
        """Play morse code as audio beeps (Windows only)"""
        try:
            output_content = self.output_text.get('1.0', tk.END).strip()
            if not output_content:
                messagebox.showinfo("Play Morse", "No morse code to play!")
                return
            
            def play_audio():
                self.play_btn.config(state='disabled')
                self.status_var.set("Playing morse code...")
                
                for char in output_content:
                    if char == '.':
                        # Short beep (200ms)
                        try:
                            winsound.Beep(800, 200)
                        except:
                            print("Beep: .")  
                        time.sleep(0.1)
                    elif char == '-':
                        # Long beep (600ms)
                        try:
                            winsound.Beep(800, 600)
                        except:
                            print("Beep: -")  
                        time.sleep(0.1)
                    elif char == ' ':
                        time.sleep(0.3)
                    elif char == '/':
                        time.sleep(0.7)
                
                self.play_btn.config(state='normal')
                self.status_var.set("Finished playing morse code")

            audio_thread = threading.Thread(target=play_audio, daemon=True)
            audio_thread.start()
            
        except Exception as e:
            messagebox.showerror("Audio Error", f"Cannot play morse code: {str(e)}")
    
    def run(self):
        """Start the GUI application"""
        sample_text = "Hello World! This is a Morse Code converter."
        self.input_text.insert('1.0', sample_text)
        
        self.root.mainloop()


if __name__ == "__main__":
    app = MorseCodeConverter()
    app.run()